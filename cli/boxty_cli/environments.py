
"""Environment management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, BoxtyConfig
from .utils import err_console, handle_sdk_error, maybe_json, require_workspace

environment_app = typer.Typer(name="environment", help="Environment management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@environment_app.command("list")
def list_environments(
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List environments."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    try:
        envs = client.environments(ws)
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(envs, as_json=True)
        return
    table = Table(title="Environments")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Workspace")
    for env in envs:
        table.add_row(env.get("environment_id", "N/A"), env.get("name", "N/A"), env.get("workspace_id", "N/A"))
    console.print(table)


@environment_app.command("create")
def create_environment(
    name: str = typer.Argument(..., help="Environment name"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
) -> None:
    """Create a new environment."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    try:
        env = client.create_environment(ws, name)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created environment[/green] {env.get('name')} ({env.get('environment_id')})")


@environment_app.command("delete")
def delete_environment(
    environment_id: str = typer.Argument(..., help="Environment ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete an environment."""
    from .utils import confirm

    cfg = load_config()
    client = get_client(cfg)
    if not yes and not confirm(f"Delete environment {environment_id}?"):
        raise typer.Exit(0)
    try:
        client.delete_environment(environment_id)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted environment[/green] {environment_id}")
