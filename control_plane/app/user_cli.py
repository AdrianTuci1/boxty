from __future__ import annotations

import argparse

from .http_client import call_api, json_dump


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty-user", description="Boxty end-user CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    signup = sub.add_parser("signup", help="Create a Boxty user account with bootstrap credit")
    signup.add_argument("--external-user-id", required=True)
    signup.add_argument("--email")
    signup.add_argument("--organization-id")

    balance = sub.add_parser("balance", help="Show user balance")
    balance.add_argument("--user-id", required=True)

    workspaces = sub.add_parser("workspaces", help="List workspaces")
    workspaces.add_argument("--owner-id")

    create_workspace = sub.add_parser("create-workspace", help="Create a workspace")
    create_workspace.add_argument("--owner-id", required=True)
    create_workspace.add_argument("--name", required=True)

    environments = sub.add_parser("environments", help="List environments in a workspace")
    environments.add_argument("--workspace-id", required=True)

    create_environment = sub.add_parser("create-environment", help="Create an environment")
    create_environment.add_argument("--workspace-id", required=True)
    create_environment.add_argument("--name", required=True)

    api_keys = sub.add_parser("api-keys", help="List API keys")
    api_keys.add_argument("--workspace-id")

    create_api_key = sub.add_parser("create-api-key", help="Create an API key")
    create_api_key.add_argument("--owner-id", required=True)
    create_api_key.add_argument("--workspace-id", required=True)
    create_api_key.add_argument("--environment-id", required=True)
    create_api_key.add_argument("--name", required=True)

    secrets = sub.add_parser("secrets", help="List secrets")
    secrets.add_argument("--workspace-id")

    create_secret = sub.add_parser("create-secret", help="Create or update a secret")
    create_secret.add_argument("--workspace-id", required=True)
    create_secret.add_argument("--name", required=True)
    create_secret.add_argument("--env", action="append", default=[])

    volumes = sub.add_parser("volumes", help="List volumes")
    volumes.add_argument("--workspace-id")

    create_volume = sub.add_parser("create-volume", help="Create a volume")
    create_volume.add_argument("--workspace-id", required=True)
    create_volume.add_argument("--name", required=True)
    create_volume.add_argument("--size-gb", type=int, default=10)
    create_volume.add_argument("--volume-type", default="object-storage")

    workloads = sub.add_parser("workloads", help="List workloads")
    workloads.add_argument("--user-id")

    create = sub.add_parser("create-workload", help="Create a sandbox/function/endpoint/build workload")
    create.add_argument("--owner-id", required=True)
    create.add_argument("--workspace-id", required=True)
    create.add_argument("--environment-id", required=True)
    create.add_argument("--kind", required=True, choices=["sandbox", "function", "endpoint", "build"])
    create.add_argument("--image", required=True)
    create.add_argument("--region")
    create.add_argument("--pool")
    create.add_argument("--endpoint-name")
    create.add_argument("--backend", choices=["provider", "runpod_serverless"])
    create.add_argument("--cpu", type=int, default=1)
    create.add_argument("--memory-mb", type=int, default=512)
    create.add_argument("--disk-gb", type=int, default=2)
    create.add_argument("--gpu-count", type=int, default=0)
    create.add_argument("--gpu-type")
    create.add_argument("--command", action="append", default=[])
    create.add_argument("--secret-name", action="append", default=[])
    create.add_argument("--volume-mount", action="append", default=[])

    session = sub.add_parser("sandbox-session", help="Request an interactive sandbox session")
    session.add_argument("--workload-id", required=True)
    session.add_argument("--requester-id", required=True)
    session.add_argument("--ttl-seconds", type=int, default=900)

    pricing = sub.add_parser("pricing", help="Show pricing model")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "signup":
        response = call_api(
            "POST",
            "/v1/auth/register",
            {
                "external_user_id": args.external_user_id,
                "email": args.email,
                "organization_id": args.organization_id,
            },
        )
    elif args.command == "balance":
        response = call_api("GET", f"/v1/accounts/{args.user_id}")
    elif args.command == "workspaces":
        suffix = f"?owner_id={args.owner_id}" if args.owner_id else ""
        response = call_api("GET", f"/v1/workspaces{suffix}")
    elif args.command == "create-workspace":
        response = call_api(
            "POST",
            "/v1/workspaces",
            {
                "owner_id": args.owner_id,
                "name": args.name,
            },
        )
    elif args.command == "environments":
        response = call_api("GET", f"/v1/workspaces/{args.workspace_id}/environments")
    elif args.command == "create-environment":
        response = call_api(
            "POST",
            "/v1/environments",
            {
                "workspace_id": args.workspace_id,
                "name": args.name,
            },
        )
    elif args.command == "api-keys":
        suffix = f"?workspace_id={args.workspace_id}" if args.workspace_id else ""
        response = call_api("GET", f"/v1/api-keys{suffix}")
    elif args.command == "create-api-key":
        response = call_api(
            "POST",
            "/v1/api-keys",
            {
                "owner_id": args.owner_id,
                "workspace_id": args.workspace_id,
                "environment_id": args.environment_id,
                "name": args.name,
            },
        )
    elif args.command == "secrets":
        suffix = f"?workspace_id={args.workspace_id}" if args.workspace_id else ""
        response = call_api("GET", f"/v1/secrets{suffix}")
    elif args.command == "create-secret":
        env_vars = {}
        for item in args.env:
            key, _, value = item.partition("=")
            if not key:
                parser.error("secret env vars must use KEY=VALUE format")
            env_vars[key] = value
        response = call_api(
            "POST",
            "/v1/secrets",
            {
                "workspace_id": args.workspace_id,
                "name": args.name,
                "env_vars": env_vars,
            },
        )
    elif args.command == "volumes":
        suffix = f"?workspace_id={args.workspace_id}" if args.workspace_id else ""
        response = call_api("GET", f"/v1/volumes{suffix}")
    elif args.command == "create-volume":
        response = call_api(
            "POST",
            "/v1/volumes",
            {
                "workspace_id": args.workspace_id,
                "name": args.name,
                "size_gb": args.size_gb,
                "volume_type": args.volume_type,
            },
        )
    elif args.command == "workloads":
        response = call_api("GET", "/v1/workloads")
        if args.user_id:
            response = [workload for workload in response if workload.get("owner_id") == args.user_id]
    elif args.command == "create-workload":
        volume_mounts = []
        for item in args.volume_mount:
            locator, sep, mount_path = item.partition(":")
            if not locator or not sep or not mount_path:
                parser.error("volume mounts must use locator:/absolute/path format")
            volume_mounts.append(
                {
                    "locator": locator,
                    "mount_path": mount_path,
                    "read_only": False,
                }
            )
        response = call_api(
            "POST",
            "/v1/workloads",
            {
                "owner_id": args.owner_id,
                "workspace_id": args.workspace_id,
                "environment_id": args.environment_id,
                "kind": args.kind,
                "image": args.image,
                "command": args.command,
                "region": args.region,
                "pool": args.pool,
                "endpoint_name": args.endpoint_name,
                "requested_backend": args.backend,
                "secret_names": args.secret_name,
                "volume_mounts": volume_mounts,
                "resources": {
                    "cpu_cores": args.cpu,
                    "memory_mb": args.memory_mb,
                    "disk_gb": args.disk_gb,
                    "gpu_count": args.gpu_count,
                    "gpu_type": args.gpu_type,
                },
            },
        )
    elif args.command == "sandbox-session":
        response = call_api(
            "POST",
            "/v1/sandbox-sessions",
            {
                "workload_id": args.workload_id,
                "requester_id": args.requester_id,
                "ttl_seconds": args.ttl_seconds,
            },
        )
    elif args.command == "pricing":
        response = call_api("GET", "/v1/pricing")
    else:
        parser.error(f"unsupported command {args.command}")
        return

    print(json_dump(response))


if __name__ == "__main__":
    main()
