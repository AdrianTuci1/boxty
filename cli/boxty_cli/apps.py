"""App commands."""
from __future__ import annotations

import json

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import confirm, print_table, raise_for_status

app = typer.Typer(name="app", help="Manage apps.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List apps (workloads).")
def list_apps(
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
    print_table(
        data, ["workload_id", "kind", "image", "status", "endpoint_name", "created_at"],
        title="Apps",
        json_output=json_output,
    )


@app.command("logs", help="Show app logs (workload runtime details).")
def app_logs(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow logs (stub)."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.get(f"/v1/workloads/{app_id}")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    runtime = data.get("runtime_details", {}) or {}
    if json_output:
        rprint(json.dumps(runtime, indent=2, default=str))
    else:
        rprint(f"[bold]App:[/bold] {app_id}")
        rprint(f"[bold]Status:[/bold] {data.get('status', 'unknown')}")
        if runtime:
            rprint("[bold]Runtime details:[/bold]")
            rprint(json.dumps(runtime, indent=2, default=str))
        else:
            rprint("[dim]No logs available.[/dim]")


@app.command("rollback", help="Stop and recreate the app from the same spec.")
def app_rollback(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Rollback app {app_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.get(f"/v1/workloads/{app_id}")
        raise_for_status(response)
        old = response.json()
        # stop old
        client.delete(f"/v1/workloads/{app_id}")
        # recreate
        payload = {
            "owner_id": old["owner_id"],
            "workspace_id": old["workspace_id"],
            "environment_id": old["environment_id"],
            "kind": old["kind"],
            "image": old["image"],
            "command": old.get("command", []),
            "env": old.get("env", {}),
            "region": old.get("region"),
            "pool": old.get("pool"),
            "endpoint_name": old.get("endpoint_name"),
            "requested_backend": old.get("requested_backend"),
            "resources": old.get("resources", {}),
        }
        response = client.post("/v1/workloads", json=payload)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Rolled back app to [bold]{data['workload_id']}[/bold].")


@app.command("stop", help="Stop an app.")
def app_stop(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Stop app {app_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.post(f"/v1/workloads/{app_id}/status", json={"status": "stopped"})
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Stopped app {app_id}.")


@app.command("history", help="Show app history.")
def app_history(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.get(f"/v1/workloads/{app_id}")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rows = [
        {
            "workload_id": data["workload_id"],
            "status": data.get("status"),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
            "accrued_cost_usd": data.get("accrued_cost_usd", 0.0),
        }
    ]
    print_table(
        rows, ["workload_id", "status", "created_at", "updated_at", "accrued_cost_usd"],
        title="App History",
        json_output=json_output,
    )


@app.command("delete", help="Delete an app.")
def app_delete(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete app {app_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/workloads/{app_id}")
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted app {app_id}.")
