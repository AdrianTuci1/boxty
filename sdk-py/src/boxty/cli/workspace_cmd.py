import typer
app = typer.Typer()

@app.command("create")
def create(name: str):
    typer.echo(f"Creating workspace {name}")

@app.command("ls")
def ls():
    typer.echo("Listing workspaces")

@app.command("rm")
def rm(id: str):
    typer.echo(f"Removing workspace {id}")
