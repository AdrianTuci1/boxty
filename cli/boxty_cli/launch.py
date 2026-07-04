"""Launch templates."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import get_config
from .utils import console, raise_for_status

app = typer.Typer(name="launch", help="Launch a template app.")

TEMPLATES = {
    "fastapi": {"image": "python:3.11", "command": ["python", "-m", "http.server", "8000"], "endpoint_name": "fastapi"},
    "gradio": {
        "image": "python:3.11",
        "command": [
            "python",
            "-c",
            "import gradio; gradio.Interface(lambda x: x, 'text', 'text').launch()",
        ],
        "endpoint_name": "gradio",
    },
}


@app.command(name="", help="Launch a template app.")
def launch(
    template: str = typer.Argument(..., help="Template name."),
    name: str | None = typer.Option(None, "--name", help="App name prefix."),
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
    if template not in TEMPLATES:
        raise typer.BadParameter(f"Unknown template: {template}. Available: {', '.join(TEMPLATES)}")

    spec = TEMPLATES[template].copy()
    spec.update({
        "owner_id": owner_id or config.token,
        "workspace_id": ws,
        "environment_id": env,
        "kind": "endpoint",
        "endpoint_name": name or spec["endpoint_name"],
        "resources": {"cpu_cores": 1, "memory_mb": 512, "disk_gb": 2, "gpu_count": 0},
    })
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        progress.add_task(f"Launching {template}...", total=None)
        client = httpx.Client(base_url=config.api_url, timeout=30, headers={"Authorization": f"Bearer {config.token}"})
        try:
            response = client.post("/v1/workloads", json=spec)
            raise_for_status(response)
            data = response.json()
        finally:
            client.close()
    rprint(f"[green]✓[/green] Launched [bold]{template}[/bold] app {data['workload_id']}.")
