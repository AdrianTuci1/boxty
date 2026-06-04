import typer
app = typer.Typer()

@app.command("create")
def create(name: str):
    typer.echo(f"Creating secret {name}")

@app.command("ls")
def ls():
    typer.echo("Listing secrets")

@app.command("rm")
def rm(name: str):
    typer.echo(f"Removing secret {name}")
