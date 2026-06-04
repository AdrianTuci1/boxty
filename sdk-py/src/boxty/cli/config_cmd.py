import typer
from ..client import Client, _save_config, _load_config

app = typer.Typer()

@app.command("login")
def login(api_key: str):
    if not api_key.startswith("boxty_"):
        typer.echo("Invalid API key format. Keys start with boxty_", err=True)
        raise typer.Exit(code=1)
    _save_config({"api_key": api_key})
    typer.echo(f"✓ Logged in with API key {api_key[:8]}...")
    try:
        client = Client()
        info = client._request("GET", "/api/auth/whoami")
        typer.echo(f"  User: {info.get('user_id', 'unknown')}")
        typer.echo(f"  Email: {info.get('email', 'unknown')}")
    except Exception:
        typer.echo("  (could not verify key — check API connectivity)")

@app.command("whoami")
def whoami():
    client = Client()
    if not client.api_key:
        typer.echo("Not logged in. Run: boxty login <api_key>", err=True)
        raise typer.Exit(code=1)
    try:
        info = client._request("GET", "/api/auth/whoami")
        typer.echo(f"User ID:  {info.get('user_id', 'unknown')}")
        typer.echo(f"Email:    {info.get('email', 'unknown')}")
        balance = info.get('balance')
        if balance is not None:
            typer.echo(f"Credits:  {balance}")
    except Exception as e:
        typer.echo(f"Error: {e}", err=True)
        raise typer.Exit(code=1)
