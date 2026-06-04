import typer
from ..client import Client

app = typer.Typer()

@app.command("create")
def create(name: str):
    client = Client()
    ws = client.create_workspace(name)
    typer.echo(f"Workspace {ws.id} created")

@app.command("ls")
def list_workspaces():
    client = Client()
    wss = client.list_workspaces()
    for ws in wss:
        typer.echo(f"{ws.id} {ws.name}")
