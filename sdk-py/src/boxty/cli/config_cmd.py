import typer
app = typer.Typer()

@app.command("login")
def login():
    typer.echo("Login to Boxty")

@app.command("logout")
def logout():
    typer.echo("Logout from Boxty")

@app.command("whoami")
def whoami():
    typer.echo("User info + balance")
