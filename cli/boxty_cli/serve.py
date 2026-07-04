"""Serve command (local dev server)."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import typer
from rich import print as rprint

from .config import get_config
from .deploy import _extract_manifest

app = typer.Typer(name="serve", help="Serve a Boxty app locally.")


@app.command(name="", help="Serve a Boxty module locally.")
def serve(
    module: Path = typer.Argument(..., exists=True, help="Path to the Python module."),
    port: int = typer.Option(8000, "--port", help="Port to serve on."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    manifest = _extract_manifest(module)
    endpoints = manifest.get("endpoints", [])
    if not endpoints:
        raise typer.BadParameter("No web endpoints defined.")

    ep = endpoints[0]
    rprint(f"[green]Serving[/green] [bold]{ep['name']}[/bold] on port {port}")
    os.environ["BOXTY_RUN_ENDPOINT"] = ep["name"]
    os.environ["BOXTY_GATEWAY_URL"] = config.api_url
    if config.token:
        os.environ["BOXTY_TOKEN"] = config.token

    sys.path.insert(0, str(module.parent))
    subprocess.run([sys.executable, str(module)], check=False)
