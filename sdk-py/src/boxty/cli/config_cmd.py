import typer
from ..client import Client

app = typer.Typer()

@app.command("login")
def login(api_key: str):
    typer.echo(f"Logged in with API key {api_key[:8]}...")

@app.command("whoami")
def whoami():
    typer.echo("User: anonymous")
