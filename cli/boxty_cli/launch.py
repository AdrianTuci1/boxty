
"""Launch templates."""

from __future__ import annotations

import typer
from rich.console import Console

from .config import load_config
from .utils import err_console

launch_app = typer.Typer(name="launch", help="Launch templates")
console = Console()

TEMPLATES: dict[str, str] = {
    "hello": "hello_world.py",
    "web": "web_app.py",
    "gpu": "gpu_example.py",
}


@launch_app.command("list")
def launch_list() -> None:
    """List available launch templates."""
    for name in TEMPLATES:
        console.print(f"[bold]{name}[/bold] - {TEMPLATES[name]}")


@launch_app.command("new")
def launch_new(
    template: str = typer.Argument(..., help="Template name"),
    output: str = typer.Option("app.py", "--output", help="Output file"),
) -> None:
    """Create a new app from a template."""
    if template not in TEMPLATES:
        err_console.print(f"[red]Unknown template: {template}[/red]")
        raise typer.Exit(1)
    from pathlib import Path

    out = Path(output)
    if template == "hello":
        out.write_text("""import boxty

app = boxty.App("hello")

@app.function()
def hello():
    print("Hello from Boxty!")

@app.local_entrypoint()
def main():
    hello()
""")
    elif template == "web":
        out.write_text("""import boxty

app = boxty.App("web")

@app.web_endpoint()
def serve():
    print("Serving on port 8000")
""")
    elif template == "gpu":
        out.write_text("""import boxty

app = boxty.App("gpu")

@app.function(gpu="A100")
def train():
    print("Training on GPU")
""")
    console.print(f"[green]Created[/green] {output} from template {template}")
