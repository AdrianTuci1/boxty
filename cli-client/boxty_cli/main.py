from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .runner import AppRunner, BoxtyCliClient, save_token, load_token
from .config import CliConfig


def _resolve_workspace_id(client: BoxtyCliClient, explicit: str | None = None) -> str:
    if explicit:
        return explicit
    me = client.whoami()
    ws = me.get("workspace_id")
    if not ws:
        raise RuntimeError("No workspace_id available; pass --workspace-id")
    return ws


def _resolve_owner_id(client: BoxtyCliClient, explicit: str | None = None) -> str:
    if explicit:
        return explicit
    me = client.whoami()
    owner = me.get("user_id")
    if not owner:
        raise RuntimeError("No user_id available; pass --owner-id")
    return owner


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty", description="Boxty unified CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    parser.add_argument("--api-url", default=os.environ.get("BOXTY_CONTROL_PLANE_URL", "http://127.0.0.1:3000"))
    parser.add_argument("--token", default=os.environ.get("BOXTY_TOKEN"))

    login = sub.add_parser("login", help="Save an API token locally")
    login.add_argument("token", help="Boxty access token")

    whoami = sub.add_parser("whoami", help="Show current user context")

    init = sub.add_parser("init", help="Scaffold a new app.py")
    init.add_argument("--name", default="my-app")
    init.add_argument("--template", choices=["python", "node", "http"], default="python")
    init.add_argument("path", nargs="?", default=".", help="Directory to scaffold")

    ls = sub.add_parser("ls", help="List workloads")
    ls.add_argument("--kind", "-k", choices=["function", "endpoint", "sandbox", "all"], default="all")

    logs = sub.add_parser("logs", help="Show workload logs")
    logs.add_argument("workload_id", help="Workload ID")

    stop = sub.add_parser("stop", help="Stop a workload")
    stop.add_argument("workload_id", help="Workload ID")

    secret = sub.add_parser("secret", help="Manage secrets")
    secret_sub = secret.add_subparsers(dest="secret_command", required=True)
    secret_create = secret_sub.add_parser("create", help="Create a secret")
    secret_create.add_argument("name", help="Secret name")
    secret_create.add_argument("--workspace-id", help="Workspace ID")
    secret_create.add_argument("--env", action="append", default=[], help="KEY=VALUE pairs")
    secret_ls = secret_sub.add_parser("ls", help="List secrets")
    secret_ls.add_argument("--workspace-id", help="Workspace ID")

    volume = sub.add_parser("volume", help="Manage volumes")
    volume_sub = volume.add_subparsers(dest="volume_command", required=True)
    volume_create = volume_sub.add_parser("create", help="Create a volume")
    volume_create.add_argument("name", help="Volume name")
    volume_create.add_argument("--workspace-id", help="Workspace ID")
    volume_create.add_argument("--size-gb", type=int, default=10)
    volume_create.add_argument("--volume-type", default="object-storage")
    volume_ls = volume_sub.add_parser("ls", help="List volumes")
    volume_ls.add_argument("--workspace-id", help="Workspace ID")

    env = sub.add_parser("env", help="Manage environments")
    env_sub = env.add_subparsers(dest="env_command", required=True)
    env_create = env_sub.add_parser("create", help="Create an environment")
    env_create.add_argument("name", help="Environment name")
    env_create.add_argument("--workspace-id", help="Workspace ID")
    env_ls = env_sub.add_parser("ls", help="List environments")
    env_ls.add_argument("--workspace-id", help="Workspace ID")

    workspace = sub.add_parser("workspace", help="Manage workspaces")
    workspace_sub = workspace.add_subparsers(dest="workspace_command", required=True)
    workspace_create = workspace_sub.add_parser("create", help="Create a workspace")
    workspace_create.add_argument("name", help="Workspace name")
    workspace_ls = workspace_sub.add_parser("ls", help="List workspaces")
    workspace_ls.add_argument("--owner-id", help="Owner ID")

    token = sub.add_parser("token", help="Manage tokens")
    token_sub = token.add_subparsers(dest="token_command", required=True)
    token_set = token_sub.add_parser("set", help="Set active token")
    token_set.add_argument("token", help="Access token")
    token_show = token_sub.add_parser("show", help="Show active token")

    profile = sub.add_parser("profile", help="Show current profile")

    config = sub.add_parser("config", help="Show CLI configuration")

    run = sub.add_parser("run", help="Run a function workload from an app.py")
    run.add_argument("app", default="app.py", nargs="?")
    run.add_argument("--function", "-f", help="Function name to run")

    deploy = sub.add_parser("deploy", help="Deploy an endpoint from an app.py")
    deploy.add_argument("app", default="app.py", nargs="?")
    deploy.add_argument("--endpoint", "-e", help="Endpoint name to deploy")
    deploy.add_argument("--no-wait", action="store_true", help="Do not wait for running status")

    sandbox = sub.add_parser("sandbox", help="Start an interactive sandbox")
    sandbox.add_argument("app", default="app.py", nargs="?")
    sandbox.add_argument("--command", "-c", dest="cmd", help="Override sandbox command")

    shell = sub.add_parser("shell", help="Alias for sandbox")
    shell.add_argument("app", default="app.py", nargs="?")
    shell.add_argument("--command", "-c", dest="cmd", help="Override sandbox command")

    route = sub.add_parser("route", help="Publish or manage public routes")
    route_sub = route.add_subparsers(dest="route_command", required=True)
    route_publish = route_sub.add_parser("publish", help="Publish a public route for an endpoint")
    route_publish.add_argument("workload_id", help="Endpoint workload ID")
    route_publish.add_argument("hostname", help="Public hostname")
    route_publish.add_argument("--path-prefix", default="/")
    route_list = route_sub.add_parser("ls", help="List published routes")

    provider = sub.add_parser("provider", help="Register or run a local provider")
    provider_sub = provider.add_subparsers(dest="provider_command", required=True)
    provider_register = provider_sub.add_parser("register", help="Register a provider")
    provider_register.add_argument("--name", default="local")
    provider_register.add_argument("--region", default="eu-central")
    provider_register.add_argument("--pool", default="general")
    provider_register.add_argument("--cpu", type=int, default=4)
    provider_register.add_argument("--memory-mb", type=int, default=8192)
    provider_register.add_argument("--disk-gb", type=int, default=50)
    provider_register.add_argument("--slots", type=int, default=2)
    provider_register.add_argument("--public-base-url", default="", help="Public base URL for route targets")
    provider_run = provider_sub.add_parser("run", help="Run provider daemon")
    provider_run.add_argument("--provider-id", required=True)
    provider_run.add_argument("--provider-token", required=True)
    provider_run.add_argument("--slots", type=int, default=2)

    version = sub.add_parser("version", help="Show version")

    return parser


def scaffold(path: str, name: str, template: str) -> None:
    target = Path(path).expanduser().resolve()
    target.mkdir(parents=True, exist_ok=True)
    if template == "python":
        content = f'''import boxty

app = boxty.App("{name}")

@app.function()
def hello(name: str = "world"):
    return f"Hello, {{name}}!"
'''
    elif template == "node":
        content = f'''import boxty
from pathlib import Path

app = boxty.App("{name}")

@app.web_endpoint(port=3000, image=boxty.Image("node:18-slim"))
def api():
    # This function is intentionally empty; the server code is in server.js
    pass
'''
        server_js = '''const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello from Boxty Node endpoint!\\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
'''
        (target / "server.js").write_text(server_js)
    else:  # http
        content = f'''import boxty

app = boxty.App("{name}")

@app.web_endpoint(port=8000, image=boxty.Image("python:3.11-slim"))
def api():
    pass
'''
    (target / "app.py").write_text(content)
    print(f"Scaffolded {template} app in {target}")


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    # Resolve token precedence: CLI flag > env > ~/.boxty/config.json
    token = args.token or os.environ.get("BOXTY_TOKEN") or load_token()
    if token:
        os.environ["BOXTY_TOKEN"] = token

    client = BoxtyCliClient(base_url=args.api_url, token=token)

    if args.command == "login":
        try:
            os.environ["BOXTY_TOKEN"] = args.token
            me = client.whoami()
            save_token(args.token)
            print(f"Logged in as user {me.get('user_id', 'unknown')}")
            return 0
        except Exception as exc:
            print(f"Login failed: {exc}", file=sys.stderr)
            return 1

    if args.command == "whoami":
        try:
            me = client.whoami()
            print(json.dumps(me, indent=2))
            return 0
        except Exception as exc:
            print(f"whoami failed: {exc}", file=sys.stderr)
            return 1

    if args.command == "init":
        scaffold(args.path, args.name, args.template)
        return 0

    if args.command == "version":
        print("boxty-cli 0.1.0")
        return 0

    if args.command == "provider":
        if args.provider_command == "register":
            import subprocess as sp
            cmd = [
                "boxty-worker", "register",
                "--provider-name", args.name,
                "--region", args.region,
                "--pool", args.pool,
                "--cpu", str(args.cpu),
                "--memory-mb", str(args.memory_mb),
                "--disk-gb", str(args.disk_gb),
                "--supports-endpoints",
            ]
            if args.public_base_url:
                cmd.extend(["--public-base-url", args.public_base_url])
            sp.run(cmd, check=True)
            return 0
        if args.provider_command == "run":
            import subprocess as sp
            cmd = [
                "boxty-worker", "run-daemon",
                "--provider-id", args.provider_id,
                "--provider-token", args.provider_token,
                "--available-slots", str(args.slots),
            ]
            sp.run(cmd, check=True)
            return 0

    if args.command == "ls":
        workloads = client.list_workloads()
        if args.kind != "all":
            workloads = [w for w in workloads if w.get("kind") == args.kind]
        if not workloads:
            print("No workloads found")
            return 0
        print(f"{'ID':<24} {'KIND':<12} {'STATUS':<12} {'IMAGE':<30}")
        for w in workloads:
            print(f"{w['workload_id']:<24} {w.get('kind', '?'):<12} {w.get('status', '?'):<12} {w.get('image', '')[:28]:<30}")
        return 0

    if args.command == "logs":
        try:
            wl = client.get_workload(args.workload_id)
            runtime = wl.get("runtime_details", {})
            stdout = runtime.get("stdout", "")
            stderr = runtime.get("stderr", "")
            if stdout:
                print("--- stdout ---")
                print(stdout)
            if stderr:
                print("--- stderr ---")
                print(stderr)
            if not stdout and not stderr:
                print("No logs captured yet")
            return 0
        except Exception as exc:
            print(f"logs failed: {exc}", file=sys.stderr)
            return 1

    if args.command == "stop":
        try:
            client.stop_workload(args.workload_id)
            print(f"Stopped workload {args.workload_id}")
            return 0
        except Exception as exc:
            print(f"stop failed: {exc}", file=sys.stderr)
            return 1

    if args.command == "route":
        if args.route_command == "publish":
            try:
                route = client.publish_route(args.workload_id, args.hostname, args.path_prefix)
                print(f"Published route {route['route_id']}")
                print(f"  hostname: {route['hostname']}")
                print(f"  target: {route['target_address']}")
                return 0
            except Exception as exc:
                print(f"route publish failed: {exc}", file=sys.stderr)
                return 1
        if args.route_command == "ls":
            try:
                routes = client.list_routes()
                if not routes:
                    print("No routes published")
                    return 0
                print(f"{'ID':<24} {'HOSTNAME':<30} {'TARGET':<40}")
                for r in routes:
                    print(f"{r['route_id']:<24} {r.get('hostname', ''):<30} {r.get('target_address', ''):<40}")
                return 0
            except Exception as exc:
                print(f"route ls failed: {exc}", file=sys.stderr)
                return 1

    if args.command == "secret":
        if args.secret_command == "create":
            try:
                env_vars = {}
                for item in args.env:
                    key, sep, value = item.partition("=")
                    if not sep:
                        print(f"Invalid env var: {item}", file=sys.stderr)
                        return 1
                    env_vars[key] = value
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                secret = client.create_secret(ws_id, args.name, env_vars)
                print(f"Created secret {secret['name']} ({secret.get('secret_id', '')})")
                return 0
            except Exception as exc:
                print(f"secret create failed: {exc}", file=sys.stderr)
                return 1
        if args.secret_command == "ls":
            try:
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                secrets = client.list_secrets(ws_id)
                if not secrets:
                    print("No secrets found")
                    return 0
                print(f"{'NAME':<20} {'KEYS':<30}")
                for s in secrets:
                    print(f"{s['name']:<20} {', '.join(s.get('key_names', [])):<30}")
                return 0
            except Exception as exc:
                print(f"secret ls failed: {exc}", file=sys.stderr)
                return 1

    if args.command == "volume":
        if args.volume_command == "create":
            try:
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                volume = client.create_volume(ws_id, args.name, args.size_gb, args.volume_type)
                print(f"Created volume {volume['name']} ({volume['volume_id']}) size={volume['size_gb']}GB")
                return 0
            except Exception as exc:
                print(f"volume create failed: {exc}", file=sys.stderr)
                return 1
        if args.volume_command == "ls":
            try:
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                volumes = client.list_volumes(ws_id)
                if not volumes:
                    print("No volumes found")
                    return 0
                print(f"{'NAME':<20} {'SIZE_GB':<10} {'TYPE':<20} {'STATUS':<12}")
                for v in volumes:
                    print(f"{v['name']:<20} {v['size_gb']:<10} {v['volume_type']:<20} {v.get('status', ''):<12}")
                return 0
            except Exception as exc:
                print(f"volume ls failed: {exc}", file=sys.stderr)
                return 1

    if args.command == "env":
        if args.env_command == "create":
            try:
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                env_record = client.create_environment(ws_id, args.name)
                print(f"Created environment {env_record['name']} ({env_record['environment_id']})")
                return 0
            except Exception as exc:
                print(f"env create failed: {exc}", file=sys.stderr)
                return 1
        if args.env_command == "ls":
            try:
                ws_id = _resolve_workspace_id(client, args.workspace_id)
                envs = client.list_environments(ws_id)
                if not envs:
                    print("No environments found")
                    return 0
                print(f"{'NAME':<20} {'ID':<24} {'DEFAULT':<10}")
                for e in envs:
                    print(f"{e['name']:<20} {e['environment_id']:<24} {str(e.get('is_default', False)):<10}")
                return 0
            except Exception as exc:
                print(f"env ls failed: {exc}", file=sys.stderr)
                return 1

    if args.command == "workspace":
        if args.workspace_command == "create":
            try:
                owner_id = _resolve_owner_id(client, args.owner_id)
                ws = client.create_workspace(owner_id, args.name)
                print(f"Created workspace {ws['name']} ({ws['workspace_id']})")
                return 0
            except Exception as exc:
                print(f"workspace create failed: {exc}", file=sys.stderr)
                return 1
        if args.workspace_command == "ls":
            try:
                owner_id = args.owner_id
                workspaces = client.list_workspaces(owner_id)
                if not workspaces:
                    print("No workspaces found")
                    return 0
                print(f"{'NAME':<20} {'ID':<24} {'OWNER':<24}")
                for w in workspaces:
                    print(f"{w['name']:<20} {w['workspace_id']:<24} {w['owner_id']:<24}")
                return 0
            except Exception as exc:
                print(f"workspace ls failed: {exc}", file=sys.stderr)
                return 1

    if args.command == "token":
        if args.token_command == "set":
            save_token(args.token)
            os.environ["BOXTY_TOKEN"] = args.token
            print("Token saved")
            return 0
        if args.token_command == "show":
            t = load_token() or os.environ.get("BOXTY_TOKEN") or ""
            print(t[:20] + "..." if len(t) > 20 else t)
            return 0

    if args.command == "profile":
        try:
            me = client.whoami()
            print(f"user: {me.get('user_id')}")
            print(f"workspace: {me.get('workspace_id')}")
            print(f"environment: {me.get('environment_id')}")
            print(f"balance: {me.get('balance')}")
            return 0
        except Exception as exc:
            print(f"profile failed: {exc}", file=sys.stderr)
            return 1

    if args.command == "config":
        try:
            t = load_token() or os.environ.get("BOXTY_TOKEN") or ""
            print(f"api_url: {args.api_url}")
            print(f"token: {t[:20]}..." if len(t) > 20 else f"token: {t}")
            me = client.whoami()
            print(f"user: {me.get('user_id')}")
            print(f"workspace: {me.get('workspace_id')}")
            return 0
        except Exception as exc:
            print(f"config failed: {exc}", file=sys.stderr)
            return 1

    runner = AppRunner(args.app, client=client)

    if args.command == "run":
        runner.run_function(args.function)
        return 0

    if args.command == "deploy":
        runner.deploy_endpoint(args.endpoint, wait=not args.no_wait)
        return 0

    if args.command in {"sandbox", "shell"}:
        cmd = getattr(args, "cmd", None)
        command_list = cmd.split() if cmd else None
        runner.start_sandbox(command_list)
        return 0

    parser.error(f"unsupported command {args.command}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
