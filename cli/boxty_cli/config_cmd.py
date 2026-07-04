
"""Config commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.panel import Panel

from .config import load_config, save_config, BoxtyConfig

config_app = typer.Typer(name="config", help="Configuration management")
console = Console()


@config_app.command("show")
def config_show() -> None:
    """Show current configuration."""
    cfg = load_config()
    panel = Panel.fit(
        f"API URL: {cfg.api_url}\n"
        f"Token: {'*' * (len(cfg.token) if cfg.token else 0)}\n"
        f"Workspace: {cfg.workspace_id or 'N/A'}\n"
        f"Environment: {cfg.environment_id or 'N/A'}\n"
        f"Environment name: {cfg.environment or 'N/A'}\n",
        title="Boxty config",
    )
    console.print(panel)


@config_app.command("set-environment")
def config_set_environment(environment: str = typer.Argument(..., help="Environment name")) -> None:
    """Set the default environment name."""
    cfg = load_config()
    cfg.environment = environment
    save_config(cfg)
    console.print(f"[green]Set environment to[/green] {environment}")
