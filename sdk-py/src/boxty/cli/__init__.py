import typer
from . import sandbox_cmd, billing_cmd, config_cmd, secret_cmd, workspace_cmd, app_cmd

app = typer.Typer(name="boxty")
app.add_typer(sandbox_cmd.app, name="sandbox")
app.add_typer(billing_cmd.app, name="billing")
app.add_typer(config_cmd.app, name="config")
app.add_typer(secret_cmd.app, name="secret")
app.add_typer(workspace_cmd.app, name="workspace")
app.add_typer(app_cmd.app, name="app")

def main():
    app()
