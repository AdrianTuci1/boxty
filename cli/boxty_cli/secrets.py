
"""Secret management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, BoxtyConfig
from .utils import err_console, handle_sdk_error, maybe_json, require_workspace

secret_app = typer.Typer(name="secret", help="Secret management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@secret_app.command("list")
def list_secrets(
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List secrets."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    try:
        secrets = client.secrets.list(ws)
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(secrets, as_json=True)
        return
    table = Table(title="Secrets")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Workspace")
    for s in secrets:
        table.add_row(s.get("secret_id", "N/A"), s.get("name", "N/A"), s.get("workspace_id", "N/A"))
    console.print(table)


@secret_app.command("create")
def create_secret(
    name: str = typer.Argument(..., help="Secret name"),
    value: str = typer.Argument(..., help="Secret value (KEY=VALUE or raw value)"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
) -> None:
    """Create a secret."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    if "=" in value:
        key, val = value.split("=", 1)
        env_vars = {key: val}
    else:
        env_vars = {"VALUE": value}
    client = get_client(cfg)
    try:
        s = client.secrets.create(ws, name, env_vars)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created secret[/green] {s.get('name')}")


@secret_app.command("delete")
def delete_secret(
    name: str = typer.Argument(..., help="Secret name"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete a secret."""
    from .utils import confirm

    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    if not yes and not confirm(f"Delete secret {name}?"):
        raise typer.Exit(0)
    try:
        client.secrets.delete(ws, name)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted secret[/green] {name}")
