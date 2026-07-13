from __future__ import annotations

import argparse
import os
import time

from .config import settings
from .http_client import call_api, json_dump
from .worker_runtime import ContainerWorkerRuntime


def _detect_resources() -> dict[str, int]:
    """Detect the VM/container resources this worker has available."""
    try:
        with open("/proc/cpuinfo") as f:
            cpu_cores = sum(1 for line in f if line.startswith("processor"))
    except Exception:
        cpu_cores = os.cpu_count() or 1

    memory_mb = 1024
    try:
        for cgroup_path in ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory.limit_in_bytes"]:
            if os.path.exists(cgroup_path):
                with open(cgroup_path) as f:
                    value = f.read().strip()
                if value and value != "max":
                    memory_mb = int(value) // (1024 * 1024)
                    break
        if memory_mb == 1024:
            with open("/proc/meminfo") as f:
                for line in f:
                    if line.startswith("MemTotal:"):
                        parts = line.split()
                        memory_mb = int(parts[1]) // 1024
                        break
    except Exception:
        pass

    disk_gb = 10
    try:
        import shutil
        usage = shutil.disk_usage(".")
        disk_gb = max(1, usage.total // (1024 * 1024 * 1024))
    except Exception:
        pass

    return {
        "cpu_cores": max(1, cpu_cores),
        "memory_mb": max(256, memory_mb),
        "disk_gb": max(1, disk_gb),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty-worker", description="Boxty worker/provider CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    register = sub.add_parser("register", help="Register this worker/provider")
    register.add_argument("--provider-name", required=True)
    register.add_argument("--region", required=True)
    register.add_argument("--pool", default="general")
    register.add_argument("--public-base-url")
    register.add_argument("--control-callback-url")
    register.add_argument("--cpu", type=int)
    register.add_argument("--memory-mb", type=int)
    register.add_argument("--disk-gb", type=int)
    register.add_argument("--gpu-count", type=int, default=0)
    register.add_argument("--gpu-type")
    register.add_argument("--supports-endpoints", action="store_true")
    register.add_argument("--supports-image-builds", action="store_true")
    register.add_argument(
        "--auto-detect-resources",
        action="store_true",
        help="Auto-detect CPU, memory, and disk from the host/container",
    )

    heartbeat = sub.add_parser("heartbeat", help="Send worker heartbeat")
    heartbeat.add_argument("--provider-id", required=True)
    heartbeat.add_argument("--provider-token", required=True)
    heartbeat.add_argument("--available-cpu-cores", type=int)
    heartbeat.add_argument("--available-memory-mb", type=int)
    heartbeat.add_argument("--available-disk-gb", type=int)
    heartbeat.add_argument("--available-gpu-count", type=int, default=0)
    heartbeat.add_argument("--running-workloads", type=int, required=True)
    heartbeat.add_argument("--status", default="online", choices=["online", "draining", "offline"])

    claim = sub.add_parser("claim-once", help="Claim and run one workload if available")
    claim.add_argument("--provider-id", required=True)
    claim.add_argument("--provider-token", required=True)

    daemon = sub.add_parser("run-daemon", help="Continuously heartbeat, claim, and run workloads")
    daemon.add_argument("--provider-id", required=True)
    daemon.add_argument("--provider-token", required=True)
    daemon.add_argument("--cpu", type=int)
    daemon.add_argument("--memory-mb", type=int)
    daemon.add_argument("--disk-gb", type=int)
    daemon.add_argument("--gpu-count", type=int, default=0)
    daemon.add_argument("--gpu-type")
    daemon.add_argument("--supports-endpoints", action="store_true")
    daemon.add_argument("--supports-image-builds", action="store_true")
    daemon.add_argument("--auto-detect-resources", action="store_true")
    daemon.add_argument("--warm-images", help="Comma-separated list of images to keep warm")
    daemon.add_argument("--warm-pool-size", type=int, default=2)
    daemon.add_argument("--poll-seconds", type=float, default=settings.worker_poll_interval_seconds)

    return parser


def _resolve_capabilities(args: argparse.Namespace) -> dict[str, int | bool | str | None]:
    if getattr(args, "auto_detect_resources", False) or (
        args.cpu is None or args.memory_mb is None or args.disk_gb is None
    ):
        detected = _detect_resources()
        cpu = args.cpu if args.cpu is not None else detected["cpu_cores"]
        memory_mb = args.memory_mb if args.memory_mb is not None else detected["memory_mb"]
        disk_gb = args.disk_gb if args.disk_gb is not None else detected["disk_gb"]
    else:
        cpu = args.cpu
        memory_mb = args.memory_mb
        disk_gb = args.disk_gb
    return {
        "cpu_cores": cpu,
        "memory_mb": memory_mb,
        "disk_gb": disk_gb,
        "gpu_count": args.gpu_count,
        "gpu_type": args.gpu_type,
        "supports_endpoint_serving": args.supports_endpoints,
        "supports_sandbox_ssh": True,
        "supports_image_builds": args.supports_image_builds,
    }


def register_provider(args: argparse.Namespace) -> dict:
    headers = {}
    shared = os.environ.get("BOXTY_PROVIDER_TOKEN", "").strip()
    if shared:
        headers["Authorization"] = f"Bearer {shared}"
    capabilities = _resolve_capabilities(args)
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
            "capabilities": capabilities,
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
    available_cpu_cores: int,
    available_memory_mb: int,
    available_disk_gb: int,
    available_gpu_count: int,
    running_workloads: int,
    available_images: list[str],
    status: str = "online",
) -> dict:
    return call_api(
        "POST",
        f"/v1/providers/{provider_id}/heartbeat",
        {
            "available_cpu_cores": available_cpu_cores,
            "available_memory_mb": available_memory_mb,
            "available_disk_gb": available_disk_gb,
            "available_gpu_count": available_gpu_count,
            "running_workloads": running_workloads,
            "available_images": available_images,
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


def _heartbeat_from_capabilities(
    provider_id: str,
    provider_token: str,
    capabilities: dict[str, int | bool | str | None],
    running_workloads: int,
    available_images: list[str],
    status: str = "online",
) -> dict:
    return send_heartbeat(
        provider_id,
        provider_token,
        available_cpu_cores=int(capabilities.get("cpu_cores", 1) or 1),
        available_memory_mb=int(capabilities.get("memory_mb", 512) or 512),
        available_disk_gb=int(capabilities.get("disk_gb", 2) or 2),
        available_gpu_count=int(capabilities.get("gpu_count", 0) or 0),
        running_workloads=running_workloads,
        available_images=available_images,
        status=status,
    )


def run_daemon(
    provider_id: str,
    provider_token: str,
    capabilities: dict[str, int | bool | str | None],
    warm_images: list[str],
    warm_pool_size: int,
    poll_seconds: float,
) -> None:
    runtime = ContainerWorkerRuntime()
    if warm_images:
        runtime.warm_images(warm_images, max_warm=warm_pool_size)

    running_workloads: set[str] = set()
    while True:
        result = claim_once(provider_id, provider_token, runtime=runtime)
        if result:
            wl = result["assignment"]["workload"]
            running_workloads.add(wl["workload_id"])
            print(json_dump(result))

        # Refresh available images for the heartbeat so the scheduler can send
        # workloads to workers that already have the image locally.
        available_images = runtime.list_local_images()
        _heartbeat_from_capabilities(
            provider_id,
            provider_token,
            capabilities,
            running_workloads=len(running_workloads),
            available_images=available_images,
        )
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
            args.available_cpu_cores or 0,
            args.available_memory_mb or 0,
            args.available_disk_gb or 0,
            args.available_gpu_count or 0,
            args.running_workloads,
            available_images=[],
            status=args.status,
        )
        print(json_dump(response))
        return
    if args.command == "claim-once":
        response = claim_once(args.provider_id, args.provider_token)
        print(json_dump(response))
        return
    if args.command == "run-daemon":
        capabilities = _resolve_capabilities(args)
        warm_images = [img.strip() for img in args.warm_images.split(",") if img.strip()] if args.warm_images else []
        run_daemon(
            args.provider_id,
            args.provider_token,
            capabilities,
            warm_images=warm_images,
            warm_pool_size=args.warm_pool_size,
            poll_seconds=args.poll_seconds,
        )
        return

    parser.error(f"unsupported command {args.command}")


if __name__ == "__main__":
    main()
