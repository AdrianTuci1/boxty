"""Shell command for interactive sandbox access."""
from __future__ import annotations

import httpx
import typer
from rich import print as rprint

from .config import get_config
from .utils import raise_for_status

app = typer.Typer(name="shell", help="Open a shell in an app.")


@app.command(name="", help="Open a shell in a running app/workload.")
def shell(
    app_id: str = typer.Argument(..., help="App/workload ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
    requester_id: str | None = typer.Option(None, "--requester-id", help="Requester ID."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = httpx.Client(base_url=config.api_url, timeout=30, headers={"Authorization": f"Bearer {config.token}"})
    try:
        response = client.post(
            "/v1/sandbox-sessions",
            json={"workload_id": app_id, "requester_id": requester_id or config.token, "ttl_seconds": 900},
        )
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Sandbox session created: [bold]{data['session_id']}[/bold]")
    rprint(f"[dim]Token: {data['token']}[/dim]")
    rprint("[yellow]![/yellow] Interactive shell attach not yet implemented via CLI.")
