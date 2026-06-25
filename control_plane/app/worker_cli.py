from __future__ import annotations

import argparse
import os
import time

from .config import settings
from .http_client import call_api, json_dump
from .worker_runtime import ContainerWorkerRuntime


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty-worker", description="Boxty worker/provider CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    register = sub.add_parser("register", help="Register this worker/provider")
    register.add_argument("--provider-name", required=True)
    register.add_argument("--region", required=True)
    register.add_argument("--pool", default="general")
    register.add_argument("--public-base-url")
    register.add_argument("--control-callback-url")
    register.add_argument("--cpu", type=int, required=True)
    register.add_argument("--memory-mb", type=int, required=True)
    register.add_argument("--disk-gb", type=int, required=True)
    register.add_argument("--gpu-count", type=int, default=0)
    register.add_argument("--gpu-type")
    register.add_argument("--supports-endpoints", action="store_true")
    register.add_argument("--supports-image-builds", action="store_true")

    heartbeat = sub.add_parser("heartbeat", help="Send worker heartbeat")
    heartbeat.add_argument("--provider-id", required=True)
    heartbeat.add_argument("--provider-token", required=True)
    heartbeat.add_argument("--available-slots", type=int, required=True)
    heartbeat.add_argument("--running-workloads", type=int, required=True)
    heartbeat.add_argument("--status", default="online", choices=["online", "draining", "offline"])

    claim = sub.add_parser("claim-once", help="Claim and run one workload if available")
    claim.add_argument("--provider-id", required=True)
    claim.add_argument("--provider-token", required=True)

    daemon = sub.add_parser("run-daemon", help="Continuously heartbeat, claim, and run workloads")
    daemon.add_argument("--provider-id", required=True)
    daemon.add_argument("--provider-token", required=True)
    daemon.add_argument("--available-slots", type=int, default=1)
    daemon.add_argument("--poll-seconds", type=float, default=settings.worker_poll_interval_seconds)

    return parser


def register_provider(args: argparse.Namespace) -> dict:
    headers = {}
    shared = os.environ.get("BOXTY_PROVIDER_TOKEN", "").strip()
    if shared:
        headers["Authorization"] = f"Bearer {shared}"
    return call_api(
        "POST",
        "/v1/providers/register",
        {
            "provider_name": args.provider_name,
            "region": args.region,
            "pool": args.pool,
            "public_base_url": args.public_base_url,
            "control_callback_url": args.control_callback_url,
            "session_access_mode": "sandbox_only",
            "capabilities": {
                "cpu_cores": args.cpu,
                "memory_mb": args.memory_mb,
                "disk_gb": args.disk_gb,
                "gpu_count": args.gpu_count,
                "gpu_type": args.gpu_type,
                "supports_endpoint_serving": args.supports_endpoints,
                "supports_sandbox_ssh": True,
                "supports_image_builds": args.supports_image_builds,
            },
        },
        headers=headers,
    )


def runtime_headers(provider_id: str, provider_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {provider_token}",
        "X-Provider-Id": provider_id,
    }


def send_heartbeat(
    provider_id: str,
    provider_token: str,
    available_slots: int,
    running_workloads: int,
    status: str = "online",
) -> dict:
    return call_api(
        "POST",
        f"/v1/providers/{provider_id}/heartbeat",
        {
            "available_slots": available_slots,
            "running_workloads": running_workloads,
            "status": status,
        },
        headers=runtime_headers(provider_id, provider_token),
    )


def claim_once(provider_id: str, provider_token: str, runtime: ContainerWorkerRuntime | None = None) -> dict | None:
    runtime = runtime or ContainerWorkerRuntime()
    headers = runtime_headers(provider_id, provider_token)
    assignment = call_api("POST", f"/v1/providers/{provider_id}/assignments/next", headers=headers)
    if not assignment:
        return None
    workload = assignment["workload"]
    launch = runtime.launch(workload)
    updated = call_api(
        "POST",
        f"/v1/workloads/{workload['workload_id']}/status",
        {
            "status": launch.status,
            "runtime_details": launch.runtime_details,
        },
        headers=headers,
    )
    return {"assignment": assignment, "updated_workload": updated}


def run_daemon(provider_id: str, provider_token: str, available_slots: int, poll_seconds: float) -> None:
    runtime = ContainerWorkerRuntime()
    while True:
        send_heartbeat(provider_id, provider_token, available_slots=available_slots, running_workloads=0)
        result = claim_once(provider_id, provider_token, runtime=runtime)
        if result:
            print(json_dump(result))
        time.sleep(poll_seconds)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "register":
        response = register_provider(args)
        print(json_dump(response))
        return
    if args.command == "heartbeat":
        response = send_heartbeat(
            args.provider_id,
            args.provider_token,
            args.available_slots,
            args.running_workloads,
            args.status,
        )
        print(json_dump(response))
        return
    if args.command == "claim-once":
        response = claim_once(args.provider_id, args.provider_token)
        print(json_dump(response))
        return
    if args.command == "run-daemon":
        run_daemon(args.provider_id, args.provider_token, args.available_slots, args.poll_seconds)
        return

    parser.error(f"unsupported command {args.command}")


if __name__ == "__main__":
    main()
