"""Environment commands."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import confirm, print_table, raise_for_status

app = typer.Typer(name="environment", help="Manage environments.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List environments for a workspace.")
def list_environments(
    workspace_id: str | None = typer.Argument(None, help="Workspace ID (defaults to active)."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    ws = workspace_id or config.workspace_id
    if not ws:
        raise typer.BadParameter("No workspace set. Run `boxty workspace switch` or pass --workspace-id.")
    client = _client(config)
    try:
        response = client.get(f"/v1/workspaces/{ws}/environments")
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    print_table(
        data, ["environment_id", "name", "workspace_id", "is_default", "created_at"],
        title="Environments",
        json_output=json_output,
    )


@app.command("create", help="Create an environment.")
def create_environment(
    name: str = typer.Argument(..., help="Environment name."),
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
    default: bool = typer.Option(False, "--default", help="Switch to this environment after creation."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    ws = workspace_id or config.workspace_id
    if not ws:
        raise typer.BadParameter("No workspace set.")
    client = _client(config)
    try:
        response = client.post("/v1/environments", json={"workspace_id": ws, "name": name})
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Created environment [bold]{data['environment_id']}[/bold] ({data['name']}).")
    if default:
        config.environment_id = data["environment_id"]
        config.save()
        rprint(f"[green]✓[/green] Switched to environment {data['environment_id']}.")


@app.command("delete", help="Delete an environment.")
def delete_environment(
    environment_id: str = typer.Argument(..., help="Environment ID."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete environment {environment_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/environments/{environment_id}")
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted environment {environment_id}.")
