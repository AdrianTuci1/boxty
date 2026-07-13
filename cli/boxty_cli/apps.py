
"""App / workload management commands."""

from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Any

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from boxty import Boxty
from boxty.app import App

from .config import load_config, BoxtyConfig
from .utils import (
    confirm,
    err_console,
    handle_sdk_error,
    maybe_json,
    require_environment,
    require_workspace,
)

app_app = typer.Typer(name="app", help="App and workload management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


def load_app(module_path: str) -> App:
    """Import a module and find the App instance."""
    path = Path(module_path)
    if not path.exists():
        err_console.print(f"[red]File not found:[/red] {module_path}")
        raise typer.Exit(1)
    sys.path.insert(0, str(path.parent.resolve()))
    try:
        import importlib.util

        spec = importlib.util.spec_from_file_location("boxty_user_module", path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {module_path}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception as exc:
        err_console.print(f"[red]Failed to load module:[/red] {exc}")
        raise typer.Exit(1)
    finally:
        sys.path.pop(0)

    for name in dir(module):
        obj = getattr(module, name)
        if isinstance(obj, App):
            obj._source_path = str(path.resolve())
            return obj
    err_console.print(f"[red]No App instance found in {module_path}[/red]")
    raise typer.Exit(1)


def resolve_run_target(module_path: str) -> tuple[App, str]:
    """Parse module.py::function."""
    if "::" in module_path:
        module_path, func_name = module_path.split("::", 1)
    else:
        err_console.print("[red]Run target must be module.py::function[/red]")
        raise typer.Exit(1)
    app = load_app(module_path)
    return app, func_name


@app_app.command("deploy")
def app_deploy(
    module_path: str = typer.Argument(..., help="Path to module containing an App"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID"),
    name: str | None = typer.Option(None, "--name", help="App name"),
) -> None:
    """Deploy a Boxty app from a Python module."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    env = environment_id or require_environment(cfg)
    app = load_app(module_path)
    client = get_client(cfg)
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            progress.add_task("Deploying app...", total=None)
            result = app.deploy(
                workspace_id=ws,
                environment_id=env,
                app_name=name or app.name,
                client=client,
            )
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deployed app[/green] {result.get('app_name')}")
    for wl in result.get("workloads", []):
        console.print(f"  [dim]Workload[/dim] {wl}")


@app_app.command("serve")
def app_serve(
    module_path: str = typer.Argument(..., help="Path to module containing an App"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID"),
) -> None:
    """Serve a Boxty app with hot reload (deploy and keep running)."""
    console.print("[yellow]Serving app (hot reload not yet implemented in CLI)[/yellow]")
    app_deploy(module_path, workspace_id=workspace_id, environment_id=environment_id)


@app_app.command("run")
def app_run(
    target: str = typer.Argument(..., help="module.py::function"),
    payload: str | None = typer.Option(None, "--payload", help="JSON payload"),
) -> None:
    """Run a function from a Boxty app module."""
    import json

    app, func_name = resolve_run_target(target)
    func_def = app.lookup(func_name)
    if func_def is None:
        err_console.print(f"[red]Function '{func_name}' not found in app[/red]")
        raise typer.Exit(1)
    cfg = load_config()
    client = get_client(cfg)
    if not func_def._workload_id:
        err_console.print(f"[red]Function '{func_name}' has not been deployed. Run 'boxty app deploy' first.[/red]")
        raise typer.Exit(1)
    try:
        data = json.loads(payload) if payload else None
        result = client.invoke_workload(func_def._workload_id, data)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(result)


@app_app.command("list")
def app_list(
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List workloads (apps)."""
    cfg = load_config()
    ws = workspace_id or cfg.workspace_id
    env = environment_id or cfg.environment_id
    client = get_client(cfg)
    try:
        workloads = client.list_workloads(workspace_id=ws, environment_id=env)
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(workloads, as_json=True)
        return
    table = Table(title="Workloads")
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


@app_app.command("logs")
def app_logs(
    app_name: str = typer.Argument(..., help="App name or workload ID"),
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow logs"),
) -> None:
    """Show app logs."""
    client = get_client()
    try:
        logs = client.get_workload_logs(app_name)
    except Exception as exc:
        handle_sdk_error(exc)
    for log in logs:
        console.print(f"[dim]{log.get('timestamp', '')}[/dim] {log.get('message', '')}")
    if follow:
        console.print("[yellow]Follow mode not yet supported[/yellow]")


@app_app.command("stop")
def app_stop(
    app_name: str = typer.Argument(..., help="Workload ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Stop a workload."""
    client = get_client()
    if not yes and not confirm(f"Stop workload {app_name}?"):
        raise typer.Exit(0)
    try:
        client.update_workload_status(app_name, "stopped")
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Stopped workload[/green] {app_name}")


@app_app.command("delete")
def app_delete(
    app_name: str = typer.Argument(..., help="Workload ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete a workload."""
    client = get_client()
    if not yes and not confirm(f"Delete workload {app_name}?"):
        raise typer.Exit(0)
    try:
        client.delete_workload(app_name)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted workload[/green] {app_name}")


@app_app.command("rollback")
def app_rollback(
    app_name: str = typer.Argument(..., help="App name or workload ID"),
) -> None:
    """Rollback an app to the previous deployment."""
    console.print("[yellow]Rollback not yet implemented by the backend[/yellow]")


@app_app.command("history")
def app_history(
    app_name: str = typer.Argument(..., help="App name or workload ID"),
) -> None:
    """Show deployment history."""
    console.print("[yellow]Deployment history not yet implemented by the backend[/yellow]")
