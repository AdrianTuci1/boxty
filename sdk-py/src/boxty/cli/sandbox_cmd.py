import typer
app = typer.Typer()

@app.command("run")
def run(file: str):
    typer.echo(f"Running {file} in cloud sandbox")

@app.command("deploy")
def deploy(file: str):
    typer.echo(f"Deploying {file}")

@app.command("shell")
def shell():
    typer.echo("Interactive sandbox shell")

@app.command("exec")
def exec_cmd(id: str, command: str):
    typer.echo(f"Executing {command} in {id}")

@app.command("ls")
def ls():
    typer.echo("Listing sandboxes")

@app.command("logs")
def logs(id: str):
    typer.echo(f"Logs for {id}")

@app.command("stop")
def stop(id: str):
    typer.echo(f"Stopping {id}")

@app.command("cp")
def cp(src: str, dest: str):
    typer.echo(f"Copying {src} to {dest}")

@app.command("forward")
def forward(id: str, port: int):
    typer.echo(f"Forwarding port {port} for {id}")

@app.command("init")
def init():
    typer.echo("Initializing boxty project")
