"""Deploy command."""
from __future__ import annotations

import sys
from pathlib import Path

import httpx
import typer
from rich import print as rprint
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import get_config
from .utils import console, raise_for_status

app = typer.Typer(name="deploy", help="Deploy a Boxty app.")


def _extract_manifest(module_path: Path) -> dict:
    """Import the SDK module and extract the App manifest."""
    import importlib.util

    sys.path.insert(0, str(module_path.parent))
    try:
        spec = importlib.util.spec_from_file_location("boxty_cli_deploy_module", module_path)
        if not spec or not spec.loader:
            raise typer.BadParameter(f"Could not load module {module_path}")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    finally:
        sys.path.pop(0)

    for name in dir(mod):
        obj = getattr(mod, name)
        cls = getattr(obj, "__class__", None)
        if cls and cls.__name__ == "App":
            return obj.to_manifest()
    raise typer.BadParameter(f"No Boxty App found in {module_path}")


@app.command(name="", help="Deploy a Boxty module.")
def deploy(
    module: Path = typer.Argument(..., exists=True, help="Path to the Python module."),
    name: str | None = typer.Option(None, "--name", help="Override app name."),
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
        raise typer.BadParameter(
            "Workspace and environment must be set. "
            "Use `boxty workspace switch` and `boxty environment create`."
        )

    manifest = _extract_manifest(module)
    app_name = name or manifest.get("name", module.stem)

    # Prepare workloads for each endpoint / function
    endpoints = manifest.get("endpoints", []) or []
    functions = manifest.get("functions", []) or []
    if not endpoints and not functions:
        raise typer.BadParameter("No functions or web endpoints defined in the module.")

    workloads = []
    for ep in endpoints:
        workloads.append({
            "owner_id": owner_id or config.token,
            "workspace_id": ws,
            "environment_id": env,
            "kind": "endpoint",
            "image": ep.get("image", {}).get("base", "python:3.11") if ep.get("image") else "python:3.11",
            "command": [],
            "endpoint_name": ep["name"],
            "resources": {"cpu_cores": 1, "memory_mb": 512, "disk_gb": 2, "gpu_count": 0},
        })
    for fn in functions:
        workloads.append({
            "owner_id": owner_id or config.token,
            "workspace_id": ws,
            "environment_id": env,
            "kind": "function",
            "image": fn.get("image", {}).get("base", "python:3.11") if fn.get("image") else "python:3.11",
            "command": [],
            "endpoint_name": fn["name"],
            "resources": {"cpu_cores": 1, "memory_mb": 512, "disk_gb": 2, "gpu_count": 0},
        })

    created = []
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        task = progress.add_task(f"Deploying {app_name}...", total=len(workloads))
        client = httpx.Client(base_url=config.api_url, timeout=30, headers={"Authorization": f"Bearer {config.token}"})
        try:
            for wl in workloads:
                response = client.post("/v1/workloads", json=wl)
                raise_for_status(response)
                created.append(response.json())
                progress.update(task, advance=1)
        finally:
            client.close()

    summary = "\n".join(f"  • {c['workload_id']} ({c['kind']})" for c in created)
    rprint(Panel.fit(f"[bold green]Deployed {app_name}[/bold green]\n{summary}"))
