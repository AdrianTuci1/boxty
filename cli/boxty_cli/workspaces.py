"""Workspace commands."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import confirm, print_table, raise_for_status

app = typer.Typer(name="workspace", help="Manage workspaces.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List workspaces.")
def list_workspaces(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    client = _client(config)
    try:
        response = client.get("/v1/workspaces")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()

    print_table(
        data, ["workspace_id", "name", "owner_id", "is_default", "created_at"],
        title="Workspaces",
        json_output=json_output,
    )


@app.command("create", help="Create a new workspace.")
def create_workspace(
    name: str = typer.Argument(..., help="Workspace name."),
    owner_id: str | None = typer.Option(None, "--owner-id", help="Owner ID (defaults to current user)."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
    default: bool = typer.Option(False, "--default", help="Switch to this workspace after creation."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.post("/v1/workspaces", json={"owner_id": owner_id or config.token, "name": name})
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()

    rprint(f"[green]✓[/green] Created workspace [bold]{data['workspace_id']}[/bold] ({data['name']}).")
    if default:
        config.workspace_id = data["workspace_id"]
        config.save()
        rprint(f"[green]✓[/green] Switched to workspace {data['workspace_id']}.")


@app.command("switch", help="Set the active workspace.")
def switch_workspace(
    workspace_id: str = typer.Argument(..., help="Workspace ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.workspace_id = workspace_id
    config.save()
    rprint(f"[green]✓[/green] Switched to workspace {workspace_id}.")


@app.command("delete", help="Delete a workspace.")
def delete_workspace(
    workspace_id: str = typer.Argument(..., help="Workspace ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete workspace {workspace_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/workspaces/{workspace_id}")
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted workspace {workspace_id}.")
