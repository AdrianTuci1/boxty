import typer
from ..client import Client

app = typer.Typer()

@app.command("create")
def create(name: str, value: str):
    client = Client()
    client.create_secret(name, value)
    typer.echo(f"Secret {name} created")

@app.command("ls")
def list_secrets():
    client = Client()
    secrets = client.list_secrets()
    for s in secrets:
        typer.echo(s.name)
