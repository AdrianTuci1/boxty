
"""API token management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, BoxtyConfig
from .utils import err_console, handle_sdk_error, maybe_json, require_workspace, require_environment, print_json

token_app = typer.Typer(name="token", help="API token management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@token_app.command("set")
def token_set(token_value: str = typer.Argument(..., help="API token")) -> None:
    """Store an API token in the config."""
    from .config import save_config

    cfg = load_config()
    cfg.token = token_value
    save_config(cfg)
    console.print("[green]Token saved[/green]")


@token_app.command("new")
def token_new(
    name: str = typer.Argument(..., help="Token name"),
    owner_id: str | None = typer.Option(None, "--owner-id", help="Owner user ID"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID"),
    as_json: bool = typer.Option(False, "--json", help="Output JSON including the secret"),
) -> None:
    """Create a new API token."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    env = environment_id or require_environment(cfg)
    owner = owner_id or cfg.user_id
    if not owner:
        err_console.print("[red]Cannot determine owner.[/red] Log in first or pass --owner-id.")
        raise typer.Exit(1)
    client = get_client(cfg)
    try:
        key = client.create_api_key(owner, ws, env, name)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created API key[/green] {key.get('name')} ({key.get('api_key_id')})")
    if key.get('token_value'):
        console.print(f"[bold]Token value:[/bold] {key.get('token_value')}")
    if as_json:
        print_json(key)
