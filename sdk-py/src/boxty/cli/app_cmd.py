import typer
app = typer.Typer()

@app.command("create")
def create(name: str):
    typer.echo(f"Creating app {name}")

@app.command("ls")
def ls():
    typer.echo("Listing apps")

@app.command("stop")
def stop(id: str):
    typer.echo(f"Stopping app {id}")

@app.command("logs")
def logs(id: str):
    typer.echo(f"Logs for app {id}")

@app.command("metrics")
def metrics(id: str):
    typer.echo(f"Metrics for app {id}")
