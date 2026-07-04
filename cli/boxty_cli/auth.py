"""Authentication commands."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import raise_for_status

app = typer.Typer(name="auth", help="Manage authentication.")


@app.command("login", help="Store your API token and verify it.")
def login(
    token: str = typer.Option(..., prompt="API token", hide_input=True, help="Your Boxty API token."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
) -> None:
    config = get_config(api_url=api_url)
    config.token = token

    client = httpx.Client(base_url=config.api_url, timeout=30)
    try:
        response = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        raise_for_status(response)
    finally:
        client.close()

    config.save()
    rprint("[green]✓[/green] Authenticated successfully.")


@app.command("logout", help="Remove stored credentials.")
def logout() -> None:
    config = get_config()
    config.token = None
    config.save()
    rprint("[green]✓[/green] Logged out.")


@app.command("whoami", help="Show the current user.")
def whoami(
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    token = config.require_token()

    client = httpx.Client(base_url=config.api_url, timeout=30)
    try:
        response = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()

    rprint(f"[bold]User:[/bold] {data.get('user_id', 'unknown')}")
    rprint(f"[bold]Email:[/bold] {data.get('email', 'unknown')}")
    rprint(f"[bold]Workspace:[/bold] {data.get('workspace_id', 'unknown')}")
    rprint(f"[bold]API URL:[/bold] {config.api_url}")
