
"""Interactive shell into a workload."""

from __future__ import annotations

import typer
from rich.console import Console

from boxty import Boxty

from .config import load_config
from .utils import err_console, handle_sdk_error

shell_app = typer.Typer(name="shell", help="Interactive shell")
console = Console()


@shell_app.command()
def shell(
    app_or_workload: str = typer.Argument(..., help="App name or workload ID"),
    command: str = typer.Option("/bin/bash", "--command", help="Shell command"),
) -> None:
    """Open an interactive shell into a sandbox workload."""
    cfg = load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    client = Boxty(base_url=cfg.api_url, token=cfg.token)
    try:
        session = client.create_sandbox_session(app_or_workload, cfg.token)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created sandbox session[/green] {session.get('session_id')}")
    console.print(f"[dim]Run the following to connect:[/dim] ssh {session.get('token')}@{session.get('session_id')}")
