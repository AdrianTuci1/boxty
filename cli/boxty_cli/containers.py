
"""Container management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, BoxtyConfig
from .utils import confirm, err_console, handle_sdk_error, maybe_json

container_app = typer.Typer(name="container", help="Container management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@container_app.command("list")
def container_list(
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List containers / workloads."""
    cfg = load_config()
    client = get_client(cfg)
    try:
        workloads = client.list_workloads(workspace_id=workspace_id, environment_id=environment_id)
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(workloads, as_json=True)
        return
    table = Table(title="Containers")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Status")
    table.add_column("Image")
    for wl in workloads:
        table.add_row(
            wl.get("workload_id", "N/A"),
            wl.get("name", "N/A"),
            wl.get("status", "N/A"),
            wl.get("image", "N/A"),
        )
    console.print(table)


@container_app.command("logs")
def container_logs(
    container_id: str = typer.Argument(..., help="Container / workload ID"),
) -> None:
    """Show container logs."""
    client = get_client()
    try:
        logs = client.get_workload_logs(container_id)
    except Exception as exc:
        handle_sdk_error(exc)
    for log in logs:
        console.print(f"[dim]{log.get('timestamp', '')}[/dim] {log.get('message', '')}")


@container_app.command("exec")
def container_exec(
    container_id: str = typer.Argument(..., help="Container / workload ID"),
    command: list[str] = typer.Argument(..., help="Command to run"),
) -> None:
    """Execute a command in a container."""
    console.print("[yellow]container exec not yet implemented by the backend[/yellow]")


@container_app.command("stop")
def container_stop(
    container_id: str = typer.Argument(..., help="Container / workload ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Stop a container."""
    client = get_client()
    if not yes and not confirm(f"Stop container {container_id}?"):
        raise typer.Exit(0)
    try:
        client.update_workload_status(container_id, "stopped")
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Stopped container[/green] {container_id}")
