from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from .runner import AppRunner, BoxtyCliClient
from .config import CliConfig


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="boxty", description="Boxty unified CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    parser.add_argument("--api-url", default=os.environ.get("BOXTY_CONTROL_PLANE_URL", "http://127.0.0.1:3000"))
    parser.add_argument("--token", default=os.environ.get("BOXTY_TOKEN"))

    init = sub.add_parser("init", help="Scaffold a new app.py")
    init.add_argument("--name", default="my-app")
    init.add_argument("--template", choices=["python", "node", "http"], default="python")
    init.add_argument("path", nargs="?", default=".", help="Directory to scaffold")

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

    client = BoxtyCliClient(base_url=args.api_url, token=args.token)
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
