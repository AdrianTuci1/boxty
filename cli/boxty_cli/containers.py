"""Container commands.

Containers map to running workloads / sandbox sessions.
"""
from __future__ import annotations

import json

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import confirm, print_table, raise_for_status

app = typer.Typer(name="container", help="Manage containers.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List containers (running workloads).")
def list_containers(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.get("/v1/workloads")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    running = [w for w in data if w.get("status") in ("running", "scheduled", "claimed")]
    print_table(
        running, ["workload_id", "kind", "image", "status", "assigned_provider_id", "created_at"],
        title="Containers",
        json_output=json_output,
    )


@app.command("logs", help="Show container logs.")
def container_logs(
    container_id: str = typer.Argument(..., help="Container/workload ID."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.get(f"/v1/workloads/{container_id}")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    runtime = data.get("runtime_details", {}) or {}
    if json_output:
        rprint(json.dumps(runtime, indent=2, default=str))
    else:
        rprint(f"[bold]Container:[/bold] {container_id}")
        rprint(f"[bold]Status:[/bold] {data.get('status', 'unknown')}")
        rprint(json.dumps(runtime, indent=2, default=str))


@app.command("exec", help="Execute a command in a container (stub via runtime details).")
def container_exec(
    container_id: str = typer.Argument(..., help="Container/workload ID."),
    command: list[str] = typer.Argument(..., help="Command to execute."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    cmd = " ".join(command)
    rprint(f"[yellow]![/yellow] Exec not yet implemented for {container_id}. Command: {cmd}")


@app.command("stop", help="Stop a container.")
def container_stop(
    container_id: str = typer.Argument(..., help="Container/workload ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Stop container {container_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.post(f"/v1/workloads/{container_id}/status", json={"status": "stopped"})
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Stopped container {container_id}.")
