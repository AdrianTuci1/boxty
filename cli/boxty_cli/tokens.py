"""API token commands."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import print_table, raise_for_status

app = typer.Typer(name="token", help="Manage API tokens.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List API tokens.")
def list_tokens(
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Filter by workspace."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        params = {"workspace_id": workspace_id} if workspace_id else None
        response = client.get("/v1/api-keys", params=params)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    print_table(
        data, ["api_key_id", "name", "workspace_id", "environment_id", "secret_preview", "created_at"],
        title="API Tokens",
        json_output=json_output,
    )


@app.command("new", help="Create a new API token.")
def new_token(
    name: str = typer.Argument(..., help="Token name."),
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    environment_id: str | None = typer.Option(None, "--environment-id", help="Environment ID."),
    owner_id: str | None = typer.Option(None, "--owner-id", help="Owner ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    ws = workspace_id or config.workspace_id
    env = environment_id or config.environment_id
    if not ws or not env:
        raise typer.BadParameter("Workspace and environment must be set.")
    client = _client(config)
    try:
        response = client.post(
            "/v1/api-keys",
            json={
                "owner_id": owner_id or config.token,
                "workspace_id": ws,
                "environment_id": env,
                "name": name,
            },
        )
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Created token [bold]{data['api_key_id']}[/bold].")
    rprint(f"[yellow]Secret:[/yellow] {data['secret_token']}")
