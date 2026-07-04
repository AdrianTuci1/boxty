"""Shared utilities for the Boxty CLI."""

from __future__ import annotations

import json
from typing import Any

import httpx
from rich.console import Console

from boxty.exceptions import BoxtyAPIError, BoxtyConnectionError

from .config import BoxtyConfig

console = Console()
err_console = Console(stderr=True)


def print_json(data: Any) -> None:
    """Print data as formatted JSON."""
    console.print(json.dumps(data, indent=2, default=str))


def handle_sdk_error(exc: Exception) -> None:
    """Pretty-print an SDK error and exit."""
    if isinstance(exc, BoxtyAPIError):
        err_console.print(f"[red]API error {exc.status_code}:[/red] {exc.message}")
    elif isinstance(exc, BoxtyConnectionError):
        err_console.print(f"[red]Connection error:[/red] {exc.message}")
    elif isinstance(exc, httpx.HTTPError):
        err_console.print(f"[red]HTTP error:[/red] {exc}")
    else:
        err_console.print(f"[red]Error:[/red] {exc}")
    raise SystemExit(1)


def confirm(message: str, *, default: bool = False) -> bool:
    """Prompt the user for confirmation."""
    suffix = " [Y/n]" if default else " [y/N]"
    try:
        response = console.input(f"{message}{suffix} ")
    except EOFError:
        return default
    return response.strip().lower() in ("y", "yes") if not default else response.strip().lower() not in ("n", "no")


def require_workspace(config: BoxtyConfig) -> str:
    """Return the active workspace_id or raise a friendly error."""
    workspace_id = config.workspace_id
    if not workspace_id:
        err_console.print("[red]No workspace selected.[/red] Run: [bold]boxty workspace create[/bold] or [bold]boxty workspace switch[/bold]")
        raise SystemExit(1)
    return workspace_id


def require_environment(config: BoxtyConfig) -> str:
    """Return the active environment_id or raise a friendly error."""
    environment_id = config.environment_id
    if not environment_id:
        err_console.print("[red]No environment selected.[/red] Run: [bold]boxty environment create[/bold]")
        raise SystemExit(1)
    return environment_id


def maybe_json(data: Any, *, as_json: bool) -> None:
    """Print as JSON if requested, otherwise let callers handle rich output."""
    if as_json:
        print_json(data)
