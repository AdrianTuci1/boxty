import typer
from ..client import Client

app = typer.Typer()

@app.command("balance")
def balance():
    client = Client()
    b = client.balance()
    typer.echo(f"Balance: {b} credits")
