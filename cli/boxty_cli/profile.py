"""Profile management commands."""

from __future__ import annotations

from typing import Any

import typer
from rich.console import Console
from rich.table import Table

from .config import BoxtyConfig, load_config, save_config
from .utils import err_console, maybe_json

profile_app = typer.Typer(name="profile", help="Manage CLI profiles")
console = Console()


def _profile_table(profiles: dict[str, dict[str, Any]], active: str) -> Table:
    table = Table(title="Profiles")
    table.add_column("Active", style="green")
    table.add_column("Name")
    table.add_column("API URL")
    table.add_column("Workspace")
    table.add_column("Environment")
    for name, data in profiles.items():
        active_marker = "*" if name == active else ""
        table.add_row(
            active_marker,
            name,
            data.get("api_url", "N/A"),
            data.get("workspace_id", "N/A") or "N/A",
            data.get("environment_id", "N/A") or "N/A",
        )
    return table


@profile_app.command("list")
def profile_list(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List configured profiles."""
    cfg = load_config()
    if json_output:
        maybe_json({
            "active": cfg.active_profile,
            "profiles": cfg.profiles,
        }, as_json=True)
        return
    if not cfg.profiles:
        console.print("[dim]No profiles configured. Use [bold]boxty profile activate[/bold] to create one.[/dim]")
        return
    console.print(_profile_table(cfg.profiles, cfg.active_profile))


@profile_app.command("activate")
def profile_activate(
    name: str = typer.Argument(..., help="Profile name"),
) -> None:
    """Activate a profile."""
    cfg = load_config()
    if name not in cfg.profiles:
        # Create a new profile by copying the current config into the profile
        cfg.profiles[name] = {
            "api_url": cfg.api_url,
            "token": cfg.token,
            "workspace_id": cfg.workspace_id,
            "environment_id": cfg.environment_id,
            "environment": cfg.environment,
        }
    cfg.active_profile = name
    profile_data = cfg.profiles[name]
    cfg.api_url = profile_data.get("api_url", cfg.api_url)
    cfg.token = profile_data.get("token", cfg.token)
    cfg.workspace_id = profile_data.get("workspace_id", cfg.workspace_id)
    cfg.environment_id = profile_data.get("environment_id", cfg.environment_id)
    cfg.environment = profile_data.get("environment", cfg.environment)
    save_config(cfg)
    console.print(f"[green]Activated profile[/green] {name}")


@profile_app.command("current")
def profile_current(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """Show the current active profile."""
    cfg = load_config()
    data = {
        "active": cfg.active_profile,
        "profile": cfg.profiles.get(cfg.active_profile, {}),
    }
    if json_output:
        maybe_json(data, as_json=True)
        return
    console.print(f"[bold]Active profile:[/bold] {cfg.active_profile}")
    if cfg.active_profile in cfg.profiles:
        console.print(_profile_table({cfg.active_profile: cfg.profiles[cfg.active_profile]}, cfg.active_profile))
