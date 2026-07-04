
"""Authentication commands for the Boxty CLI."""

from __future__ import annotations

import typer
from rich.console import Console

from boxty import Boxty

from .config import load_config, save_config, BoxtyConfig
from .utils import err_console, handle_sdk_error

auth_app = typer.Typer(name="auth", help="Authentication commands")
console = Console()


def require_config() -> BoxtyConfig:
    """Return current config; prompt if missing token."""
    cfg = load_config()
    return cfg


@auth_app.command("login")
def login(
    external_user_id: str = typer.Argument(..., help="External user identifier"),
    email: str | None = typer.Option(None, "--email", help="User email"),
    api_url: str | None = typer.Option(None, "--api-url", help="Boxty API URL"),
) -> None:
    """Log in to Boxty and store the access token."""
    cfg = load_config()
    client = Boxty(base_url=api_url or cfg.api_url)
    try:
        result = client.login(external_user_id, email=email)
    except Exception as exc:
        handle_sdk_error(exc)
    cfg.token = result.get("access_token")
    if api_url:
        cfg.api_url = api_url
    save_config(cfg)
    console.print(f"[green]Logged in as {result.get('user_id', external_user_id)}[/green]")


@auth_app.command("logout")
def logout() -> None:
    """Remove stored credentials."""
    cfg = load_config()
    cfg.token = None
    save_config(cfg)
    console.print("[green]Logged out[/green]")


@auth_app.command("whoami")
def whoami() -> None:
    """Show the currently authenticated user."""
    cfg = load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    client = Boxty(base_url=cfg.api_url, token=cfg.token)
    try:
        me = client.whoami()
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[bold]User:[/bold] {me.get('user_id')}")
    console.print(f"[bold]Email:[/bold] {me.get('email') or 'N/A'}")
