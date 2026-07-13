
"""Authentication commands for the Boxty CLI."""

from __future__ import annotations

import time

import typer
from rich.console import Console

from boxty import Boxty

from .config import load_config, save_config, BoxtyConfig
from .utils import err_console, handle_sdk_error

auth_app = typer.Typer(name="auth", help="Authentication commands")
console = Console()


def require_config() -> BoxtyConfig:
    """Return current config; prompt if missing token."""
    cfg = load_config()
    return cfg


@auth_app.command("login")
def login(
    external_user_id: str = typer.Argument(..., help="External user identifier"),
    email: str | None = typer.Option(None, "--email", help="User email"),
    api_url: str | None = typer.Option(None, "--api-url", help="Boxty API URL"),
) -> None:
    """Log in to Boxty and store the access token."""
    cfg = load_config()
    client = Boxty(base_url=api_url or cfg.api_url)
    try:
        result = client.login(external_user_id, email=email)
    except Exception as exc:
        handle_sdk_error(exc)
    cfg.token = result.get("access_token")
    if api_url:
        cfg.api_url = api_url
    save_config(cfg)
    console.print(f"[green]Logged in as {result.get('user_id', external_user_id)}[/green]")


@auth_app.command("login-web")
def login_web(
    api_url: str | None = typer.Option(None, "--api-url", help="Boxty API URL"),
    external_user_id: str | None = typer.Option(None, "--user-id", help="External user identifier (optional)"),
    email: str | None = typer.Option(None, "--email", help="User email (optional)"),
    open_browser: bool = typer.Option(True, "--open-browser/--no-open-browser", help="Open the verification URL in a browser"),
    prompt: bool = typer.Option(False, "--prompt", help="Paste the access token manually instead of waiting for the browser"),
) -> None:
    """Log in via the web UI and store the access token."""
    cfg = load_config()
    base_url = api_url or cfg.api_url
    client = Boxty(base_url=base_url)
    try:
        device = client.device_code()
    except Exception as exc:
        handle_sdk_error(exc)

    console.print("[bold]Authenticate in your browser:[/bold]")
    console.print(f"[link={device['verification_uri_complete']}]{device['verification_uri_complete']}[/link]")
    console.print(f"[dim]User code: {device['user_code']}[/dim]")
    if open_browser:
        try:
            import webbrowser
            webbrowser.open(device["verification_uri_complete"])
        except Exception:
            pass

    if prompt:
        token = typer.prompt("Paste the access token here", default="")
        if token and token.strip():
            cfg.token = token.strip()
            cfg.user_id = external_user_id or ""
            cfg.api_url = base_url
            save_config(cfg)
            console.print("[green]Token saved.[/green]")
            return

    console.print("[dim]Waiting for you to complete login in the browser...[/dim]")
    poll_interval = device.get("interval", 5)
    expires_in = device.get("expires_in", 600)
    deadline = time.time() + expires_in
    token = None
    while time.time() < deadline:
        try:
            status = client.device_token(device["device_code"])
        except Exception as exc:
            handle_sdk_error(exc)
        if status.get("status") == "authorized":
            token = status.get("access_token")
            user_id = status.get("user_id")
            break
        if status.get("status") == "expired":
            err_console.print("[red]Device code expired.[/red]")
            raise typer.Exit(1)
        time.sleep(poll_interval)
    if not token:
        err_console.print("[red]Login timed out.[/red]")
        raise typer.Exit(1)

    cfg.token = token
    cfg.user_id = user_id
    cfg.api_url = base_url
    save_config(cfg)
    console.print(f"[green]Logged in as {user_id or 'web user'}[/green]")


@auth_app.command("logout")
def logout() -> None:
    """Remove stored credentials."""
    cfg = load_config()
    cfg.token = None
    save_config(cfg)
    console.print("[green]Logged out[/green]")


@auth_app.command("whoami")
def whoami() -> None:
    """Show the currently authenticated user."""
    cfg = load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    client = Boxty(base_url=cfg.api_url, token=cfg.token)
    try:
        me = client.whoami()
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[bold]User:[/bold] {me.get('user_id')}")
    console.print(f"[bold]Email:[/bold] {me.get('email') or 'N/A'}")
