import typer
from ..client import Client

app = typer.Typer()

@app.command("create")
def create(name: str, image: str, cpu: int = 1, memory: int = 1024):
    client = Client()
    a = client.create_app(workspace_id="default", env_id="default", name=name, image=image, cpu=cpu, memory=memory)
    typer.echo(f"App {a.id} created")

@app.command("ls")
def list_apps():
    client = Client()
    apps = client.list_apps()
    for a in apps:
        typer.echo(f"{a.id} {a.name}")

@app.command("stop")
def stop(id: str):
    client = Client()
    client.stop_app(id)
    typer.echo(f"App {id} stopped")
