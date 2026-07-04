"""Secret commands."""
from __future__ import annotations

from pathlib import Path

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import confirm, print_table, raise_for_status

app = typer.Typer(name="secret", help="Manage secrets.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List secrets.")
def list_secrets(
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        params = {"workspace_id": workspace_id} if workspace_id else None
        response = client.get("/v1/secrets", params=params)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    print_table(
        data, ["secret_id", "name", "workspace_id", "key_names", "created_at"],
        title="Secrets",
        json_output=json_output,
    )


@app.command("create", help="Create a secret from key=value pairs or a .env file.")
def create_secret(
    name: str = typer.Argument(..., help="Secret name."),
    values: list[str] = typer.Argument(None, help="KEY=VALUE pairs."),
    env_file: Path | None = typer.Option(None, "--env-file", help="Path to a .env file."),
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    ws = workspace_id or config.workspace_id
    if not ws:
        raise typer.BadParameter("No workspace set.")

    env_vars: dict[str, str] = {}
    if env_file:
        with env_file.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                env_vars[key.strip()] = value.strip().strip('\'"')
    if values:
        for pair in values:
            if "=" not in pair:
                raise typer.BadParameter(f"Invalid KEY=VALUE pair: {pair}")
            key, _, value = pair.partition("=")
            env_vars[key] = value
    if not env_vars:
        raise typer.BadParameter("No key=value pairs or env file provided.")

    client = _client(config)
    try:
        response = client.post("/v1/secrets", json={"workspace_id": ws, "name": name, "env_vars": env_vars})
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Created secret [bold]{data['secret_id']}[/bold] ({data['name']}).")


@app.command("delete", help="Delete a secret.")
def delete_secret(
    workspace_id: str = typer.Argument(..., help="Workspace ID."),
    name: str = typer.Argument(..., help="Secret name."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete secret {name} in workspace {workspace_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/secrets/{workspace_id}/{name}")
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted secret {name}.")
