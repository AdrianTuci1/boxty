
"""Workspace management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, save_config, BoxtyConfig
from .utils import err_console, handle_sdk_error, maybe_json

workspace_app = typer.Typer(name="workspace", help="Workspace management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@workspace_app.command("list")
def list_workspaces(json_output: bool = typer.Option(False, "--json", help="Output as JSON")) -> None:
    """List workspaces."""
    cfg = load_config()
    client = get_client(cfg)
    try:
        workspaces = client.workspaces()
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(workspaces, as_json=True)
        return
    table = Table(title="Workspaces")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Owner")
    for ws in workspaces:
        table.add_row(ws.get("workspace_id", "N/A"), ws.get("name", "N/A"), ws.get("owner_id", "N/A"))
    console.print(table)


@workspace_app.command("create")
def create_workspace(
    name: str = typer.Argument(..., help="Workspace name"),
    owner_id: str | None = typer.Option(None, "--owner-id", help="Owner user ID"),
    switch: bool = typer.Option(False, "--switch", help="Switch to this workspace after creation"),
) -> None:
    """Create a new workspace."""
    cfg = load_config()
    client = get_client(cfg)
    try:
        ws = client.create_workspace(name, owner_id=owner_id)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created workspace[/green] {ws.get('name')} ({ws.get('workspace_id')})")
    if switch:
        cfg.workspace_id = ws.get("workspace_id")
        save_config(cfg)
        console.print(f"[green]Switched to workspace[/green] {ws.get('workspace_id')}")


@workspace_app.command("switch")
def switch_workspace(workspace_id: str = typer.Argument(..., help="Workspace ID")) -> None:
    """Set the active workspace."""
    cfg = load_config()
    cfg.workspace_id = workspace_id
    save_config(cfg)
    console.print(f"[green]Switched to workspace[/green] {workspace_id}")


@workspace_app.command("delete")
def delete_workspace(
    workspace_id: str = typer.Argument(..., help="Workspace ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete a workspace."""
    from .utils import confirm

    cfg = load_config()
    client = get_client(cfg)
    if not yes and not confirm(f"Delete workspace {workspace_id}?"):
        raise typer.Exit(0)
    try:
        client.delete_workspace(workspace_id)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted workspace[/green] {workspace_id}")
    if cfg.workspace_id == workspace_id:
        cfg.workspace_id = None
        save_config(cfg)
