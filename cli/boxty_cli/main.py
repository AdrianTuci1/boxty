
"""Boxty CLI entry point."""

from __future__ import annotations

import typer
from rich.console import Console

from .auth import auth_app
from .workspaces import workspace_app
from .environments import environment_app
from .secrets import secret_app
from .volumes import volume_app
from .tokens import token_app
from .apps import app_app
from .containers import container_app
from .launch import launch_app
from .shell import shell_app
from .config_cmd import config_app

app = typer.Typer(
    name="boxty",
    help="Boxty CLI — Modal-style serverless GPU platform",
    add_completion=False,
)
app.add_typer(auth_app)
app.add_typer(workspace_app)
app.add_typer(environment_app)
app.add_typer(secret_app)
app.add_typer(volume_app)
app.add_typer(token_app)
app.add_typer(app_app)
app.add_typer(container_app)
app.add_typer(launch_app)
app.add_typer(shell_app)
app.add_typer(config_app)

console = Console()


@app.callback()
def main(
    api_url: str | None = typer.Option(None, "--api-url", help="Boxty API URL", envvar="BOXTY_API_URL"),
    token: str | None = typer.Option(None, "--token", help="Boxty API token", envvar="BOXTY_TOKEN"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID", envvar="BOXTY_WORKSPACE_ID"),
    environment_id: str | None = typer.Option(None, "--environment", help="Environment ID", envvar="BOXTY_ENVIRONMENT_ID"),
) -> None:
    """Boxty CLI."""
    pass


if __name__ == "__main__":
    app()
