import typer
app = typer.Typer()

@app.command("billing")
def billing():
    typer.echo("Billing history")
