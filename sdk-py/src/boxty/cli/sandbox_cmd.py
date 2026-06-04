import typer
from typing import Optional
from ..client import Client

app = typer.Typer()

@app.command("run")
def run(image: str, cpu: int = 1, memory: int = 1024):
    client = Client()
    sb = client.create_sandbox(image=image, cpu=cpu, memory=memory)
    typer.echo(f"Sandbox {sb.id} started")

@app.command("stop")
def stop(id: str):
    client = Client()
    client.delete_sandbox(id)
    typer.echo(f"Sandbox {id} stopped")

@app.command("ls")
def list_sandboxes():
    client = Client()
    sbs = client.list_sandboxes()
    for sb in sbs:
        typer.echo(f"{sb.id} {sb.status}")
