from __future__ import annotations

import argparse

from .http_client import call_api, json_dump


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty-supervisor", description="Boxty supervisor/provider CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    register = sub.add_parser("register-provider", help="Register a provider in the control plane")
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

    heartbeat = sub.add_parser("heartbeat", help="Send a provider heartbeat")
    heartbeat.add_argument("--provider-id", required=True)
    heartbeat.add_argument("--available-slots", type=int, required=True)
    heartbeat.add_argument("--running-workloads", type=int, required=True)
    heartbeat.add_argument("--status", default="online", choices=["online", "draining", "offline"])

    providers = sub.add_parser("providers", help="List providers")

    meter = sub.add_parser("meter-usage", help="Charge workload usage to the owner account")
    meter.add_argument("--workload-id", required=True)
    meter.add_argument("--cpu-seconds", type=float, default=0.0)
    meter.add_argument("--ram-gb-seconds", type=float, default=0.0)
    meter.add_argument("--gpu-seconds", type=float, default=0.0)
    meter.add_argument("--storage-gb-seconds", type=float, default=0.0)

    runpod = sub.add_parser("dispatch-runpod", help="Attach a RunPod backend to a workload")
    runpod.add_argument("--workload-id", required=True)
    runpod.add_argument("--template", required=True)
    runpod.add_argument("--gpu-type")
    runpod.add_argument("--gpu-count", type=int, default=0)

    route = sub.add_parser("publish-route", help="Publish a Boxty route to a workload")
    route.add_argument("--workload-id", required=True)
    route.add_argument("--hostname", required=True)
    route.add_argument("--path-prefix", default="/")

    workloads = sub.add_parser("workloads", help="List workloads")

    invites = sub.add_parser("invites", help="List workspace invites")
    invites.add_argument("--workspace-id")

    create_invite = sub.add_parser("create-invite", help="Create an email invite for a workspace")
    create_invite.add_argument("--inviter-user-id", required=True)
    create_invite.add_argument("--workspace-id", required=True)
    create_invite.add_argument("--email", required=True)
    create_invite.add_argument("--role", default="developer")

    dynamodb = sub.add_parser("dynamodb-items", help="Inspect the single-table DynamoDB item layout")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "register-provider":
        response = call_api(
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
        )
    elif args.command == "heartbeat":
        response = call_api(
            "POST",
            f"/v1/providers/{args.provider_id}/heartbeat",
            {
                "available_slots": args.available_slots,
                "running_workloads": args.running_workloads,
                "status": args.status,
            },
        )
    elif args.command == "providers":
        response = call_api("GET", "/v1/providers")
    elif args.command == "meter-usage":
        response = call_api(
            "POST",
            "/v1/usage/meter",
            {
                "workload_id": args.workload_id,
                "cpu_seconds": args.cpu_seconds,
                "ram_gb_seconds": args.ram_gb_seconds,
                "gpu_seconds": args.gpu_seconds,
                "storage_gb_seconds": args.storage_gb_seconds,
            },
        )
    elif args.command == "dispatch-runpod":
        response = call_api(
            "POST",
            "/v1/runpod/dispatch",
            {
                "workload_id": args.workload_id,
                "template": args.template,
                "gpu_type": args.gpu_type,
                "gpu_count": args.gpu_count,
            },
        )
    elif args.command == "publish-route":
        response = call_api(
            "POST",
            "/v1/routes",
            {
                "workload_id": args.workload_id,
                "hostname": args.hostname,
                "path_prefix": args.path_prefix,
            },
        )
    elif args.command == "workloads":
        response = call_api("GET", "/v1/workloads")
    elif args.command == "invites":
        suffix = f"?workspace_id={args.workspace_id}" if args.workspace_id else ""
        response = call_api("GET", f"/v1/invites{suffix}")
    elif args.command == "create-invite":
        response = call_api(
            "POST",
            "/v1/invites",
            {
                "inviter_user_id": args.inviter_user_id,
                "workspace_id": args.workspace_id,
                "email": args.email,
                "role": args.role,
            },
        )
    elif args.command == "dynamodb-items":
        response = call_api("GET", "/v1/admin/dynamodb-items")
    else:
        parser.error(f"unsupported command {args.command}")
        return

    print(json_dump(response))


if __name__ == "__main__":
    main()
