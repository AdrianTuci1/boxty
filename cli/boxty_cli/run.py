"""Run command for ad-hoc functions."""
from __future__ import annotations

from pathlib import Path

import httpx
import typer
from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import get_config
from .deploy import _extract_manifest
from .utils import console, raise_for_status

app = typer.Typer(name="run", help="Run a Boxty function.")


@app.command(name="", help="Run a function in a Boxty module.")
def run(
    target: str = typer.Argument(..., help="Module path or module::function (e.g. app.py::my_func)."),
    args: list[str] = typer.Argument(None, help="Positional arguments to pass."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    environment_id: str | None = typer.Option(None, "--environment-id", help="Environment ID."),
    owner_id: str | None = typer.Option(None, "--owner-id", help="Owner ID."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    ws = workspace_id or config.workspace_id
    env = environment_id or config.environment_id
    if not ws or not env:
        raise typer.BadParameter("Workspace and environment must be set.")

    if "::" in target:
        module_path, fn_name = target.split("::", 1)
    else:
        raise typer.BadParameter("Target must be in the form module.py::function")

    module = Path(module_path)
    if not module.exists():
        raise typer.BadParameter(f"Module not found: {module}")

    manifest = _extract_manifest(module)
    fn_def = next((f for f in (manifest.get("functions", []) or []) if f["name"] == fn_name), None)
    if not fn_def:
        raise typer.BadParameter(f"Function {fn_name} not found in {module}")

    image = fn_def.get("image", {}).get("base", "python:3.11") if fn_def.get("image") else "python:3.11"
    payload = {
        "owner_id": owner_id or config.token,
        "workspace_id": ws,
        "environment_id": env,
        "kind": "function",
        "image": image,
        "command": ["python", "-c", f"import {module.stem}; {module.stem}.{fn_name}()"],
        "endpoint_name": fn_name,
        "resources": {"cpu_cores": 1, "memory_mb": 512, "disk_gb": 2, "gpu_count": 0},
    }

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        progress.add_task(f"Running {fn_name}...", total=None)
        client = httpx.Client(base_url=config.api_url, timeout=30, headers={"Authorization": f"Bearer {config.token}"})
        try:
            response = client.post("/v1/workloads", json=payload)
            raise_for_status(response)
            data = response.json()
        finally:
            client.close()

    rprint(f"[green]✓[/green] Started function run [bold]{data['workload_id']}[/bold].")
    if args:
        rprint(f"[dim]Arguments: {args}[/dim]")
