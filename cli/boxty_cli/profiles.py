"""Profile commands."""
from __future__ import annotations

import json

import typer
from rich import print as rprint

from .config import CONFIG_PATH, ConfigFile, Profile
from .utils import print_table

app = typer.Typer(name="profile", help="Manage CLI profiles.")


def _load_config() -> ConfigFile:
    if not CONFIG_PATH.exists():
        return ConfigFile()
    import json
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return ConfigFile.model_validate(json.load(f))


def _save_config(config: ConfigFile) -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2)


@app.command("list", help="List profiles.")
def list_profiles(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
) -> None:
    config = _load_config()
    rows = []
    for name, profile in config.profiles.items():
        row = profile.model_dump()
        row["active"] = name == config.active_profile
        row["name"] = name
        rows.append(row)
    print_table(
        rows, ["name", "active", "api_url", "workspace_id", "environment_id"],
        title="Profiles",
        json_output=json_output,
    )


@app.command("activate", help="Activate a profile.")
def activate_profile(
    name: str = typer.Argument(..., help="Profile name."),
    api_url: str | None = typer.Option(None, "--api-url", help="API URL for new profile."),
) -> None:
    config = _load_config()
    if name not in config.profiles:
        config.profiles[name] = Profile(name=name, api_url=api_url or "http://127.0.0.1:8080")
    config.active_profile = name
    _save_config(config)
    rprint(f"[green]✓[/green] Activated profile [bold]{name}[/bold].")


@app.command("current", help="Show the active profile.")
def current_profile() -> None:
    config = _load_config()
    profile = config.profiles.get(config.active_profile, Profile(name=config.active_profile))
    rprint(f"[bold]Profile:[/bold] {config.active_profile}")
    rprint(f"[bold]API URL:[/bold] {profile.api_url}")
    rprint(f"[bold]Workspace:[/bold] {profile.workspace_id or 'unset'}")
    rprint(f"[bold]Environment:[/bold] {profile.environment_id or 'unset'}")
