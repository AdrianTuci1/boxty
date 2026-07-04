
"""Volume management commands."""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table

from boxty import Boxty

from .config import load_config, BoxtyConfig
from .utils import err_console, handle_sdk_error, maybe_json, require_workspace

volume_app = typer.Typer(name="volume", help="Volume management")
console = Console()


def get_client(cfg: BoxtyConfig | None = None) -> Boxty:
    cfg = cfg or load_config()
    if not cfg.token:
        err_console.print("[red]Not logged in.[/red] Run: [bold]boxty auth login[/bold]")
        raise typer.Exit(1)
    return Boxty(base_url=cfg.api_url, token=cfg.token)


@volume_app.command("list")
def list_volumes(
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
) -> None:
    """List volumes."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    try:
        volumes = client.volumes.list(ws)
    except Exception as exc:
        handle_sdk_error(exc)
    if json_output:
        maybe_json(volumes, as_json=True)
        return
    table = Table(title="Volumes")
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Type")
    table.add_column("Size")
    for v in volumes:
        table.add_row(
            v.get("volume_id", "N/A"),
            v.get("name", "N/A"),
            v.get("volume_type", "N/A"),
            str(v.get("size_gb", "N/A")),
        )
    console.print(table)


@volume_app.command("create")
def create_volume(
    name: str = typer.Argument(..., help="Volume name"),
    size_gb: int = typer.Option(10, "--size", help="Size in GB"),
    volume_type: str = typer.Option("object-storage", "--type", help="Volume type"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
) -> None:
    """Create a new volume."""
    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    try:
        v = client.volumes.create(ws, name, size_gb, volume_type)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Created volume[/green] {v.get('name')} ({v.get('volume_id')})")


@volume_app.command("delete")
def delete_volume(
    volume_id: str = typer.Argument(..., help="Volume ID"),
    workspace_id: str | None = typer.Option(None, "--workspace", help="Workspace ID"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete a volume."""
    from .utils import confirm

    cfg = load_config()
    ws = workspace_id or require_workspace(cfg)
    client = get_client(cfg)
    if not yes and not confirm(f"Delete volume {volume_id}?"):
        raise typer.Exit(0)
    try:
        client.volumes.delete(ws, volume_id)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted volume[/green] {volume_id}")


@volume_app.command("ls")
def volume_ls(
    volume_id: str = typer.Argument(..., help="Volume ID"),
    path: str = typer.Option("/", "--path", help="Directory path"),
) -> None:
    """List volume entries."""
    client = get_client()
    try:
        entries = client.volumes.list_entries(volume_id, path)
    except Exception as exc:
        handle_sdk_error(exc)
    table = Table(title=f"Volume {volume_id} entries")
    table.add_column("Path", style="cyan")
    table.add_column("Type")
    table.add_column("Size")
    for e in entries:
        table.add_row(e.get("path", "N/A"), e.get("entry_type", "N/A"), str(e.get("size", "N/A")))
    console.print(table)


@volume_app.command("get")
def volume_get(
    volume_id: str = typer.Argument(..., help="Volume ID"),
    path: str = typer.Argument(..., help="Remote path to download"),
    local_path: str | None = typer.Argument(None, help="Local destination"),
) -> None:
    """Download a file from a volume."""
    client = get_client()
    try:
        data = client.volumes.get_blob(volume_id, path)
    except Exception as exc:
        handle_sdk_error(exc)
    if local_path:
        with open(local_path, "wb") as f:
            f.write(data)
        console.print(f"[green]Downloaded[/green] {path} -> {local_path}")
    else:
        console.print(data.decode("utf-8", errors="replace"))


@volume_app.command("put")
def volume_put(
    volume_id: str = typer.Argument(..., help="Volume ID"),
    local_path: str = typer.Argument(..., help="Local file to upload"),
    remote_path: str | None = typer.Argument(None, help="Remote destination"),
) -> None:
    """Upload a file to a volume."""
    from pathlib import Path

    client = get_client()
    src = Path(local_path)
    dst = remote_path or f"/{src.name}"
    try:
        data = src.read_bytes()
        client.volumes.put_blob(volume_id, dst, data)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Uploaded[/green] {local_path} -> {dst}")


@volume_app.command("rm")
def volume_rm(
    volume_id: str = typer.Argument(..., help="Volume ID"),
    path: str = typer.Argument(..., help="Remote path to delete"),
    yes: bool = typer.Option(False, "--yes", help="Skip confirmation"),
) -> None:
    """Delete a file from a volume."""
    from .utils import confirm

    client = get_client()
    if not yes and not confirm(f"Delete {path} from volume {volume_id}?"):
        raise typer.Exit(0)
    try:
        client.volumes.delete_blob(volume_id, path)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Deleted[/green] {path}")


@volume_app.command("cp")
def volume_cp(
    src: str = typer.Argument(..., help="Source: volume_id:path"),
    dst: str = typer.Argument(..., help="Destination: volume_id:path"),
) -> None:
    """Copy a file between volumes."""
    client = get_client()
    try:
        src_vol, src_path = src.split(":", 1)
        dst_vol, dst_path = dst.split(":", 1)
    except ValueError:
        err_console.print("[red]Source and destination must be in the form volume_id:path[/red]")
        raise typer.Exit(1)
    try:
        data = client.volumes.get_blob(src_vol, src_path)
        client.volumes.put_blob(dst_vol, dst_path, data)
    except Exception as exc:
        handle_sdk_error(exc)
    console.print(f"[green]Copied[/green] {src} -> {dst}")
