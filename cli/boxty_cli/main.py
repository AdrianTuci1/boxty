"""Boxty CLI entry point."""
from __future__ import annotations

import typer

from .apps import app as app_app
from .auth import app as auth_app
from .containers import app as container_app
from .deploy import app as deploy_app
from .environments import app as environment_app
from .launch import app as launch_app
from .profiles import app as profile_app
from .run import app as run_app
from .secrets import app as secret_app
from .serve import app as serve_app
from .shell import app as shell_app
from .tokens import app as token_app
from .volumes import app as volume_app
from .workspaces import app as workspace_app

app = typer.Typer(name="boxty", help="Boxty CLI — serverless GPU platform", no_args_is_help=True)

app.add_typer(auth_app, name="auth")
app.add_typer(workspace_app, name="workspace")
app.add_typer(environment_app, name="environment")
app.add_typer(app_app, name="app")
app.add_typer(container_app, name="container")
app.add_typer(secret_app, name="secret")
app.add_typer(volume_app, name="volume")
app.add_typer(token_app, name="token")
app.add_typer(profile_app, name="profile")
app.add_typer(deploy_app, name="deploy")
app.add_typer(serve_app, name="serve")
app.add_typer(run_app, name="run")
app.add_typer(shell_app, name="shell")
app.add_typer(launch_app, name="launch")


@app.command("config", help="Show configuration.")
def config_show(
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    from rich import print as rprint

    from .config import get_config

    cfg = get_config(api_url=api_url, token=token)
    rprint(f"[bold]API URL:[/bold]      {cfg.api_url}")
    rprint(f"[bold]Token:[/bold]        {'*' * (len(cfg.token) if cfg.token else 0)} (set={bool(cfg.token)})")
    rprint(f"[bold]Workspace:[/bold]    {cfg.workspace_id or 'unset'}")
    rprint(f"[bold]Environment:[/bold] {cfg.environment_id or 'unset'}")
    rprint(f"[bold]Config file:[/bold]  {cfg._active.__class__}")


@app.command("setup", help="Run first-time setup.")
def setup() -> None:
    from rich import print as rprint

    from .config import CONFIG_PATH, get_config

    rprint("[bold]Boxty CLI setup[/bold]")
    api_url = typer.prompt("API URL", default="http://127.0.0.1:8080")
    token = typer.prompt("API token", hide_input=True)
    cfg = get_config(api_url=api_url, token=token)
    cfg.save()
    rprint(f"[green]✓[/green] Configuration saved to {CONFIG_PATH}")


if __name__ == "__main__":
    app()
