"""Volume commands."""
from __future__ import annotations

from pathlib import Path

import httpx
import typer
from rich import print as rprint
from rich.progress import Progress, SpinnerColumn, TextColumn

from .config import get_config
from .utils import confirm, console, print_table, raise_for_status

app = typer.Typer(name="volume", help="Manage volumes.")


def _client(config) -> httpx.Client:
    headers = {}
    if config.token:
        headers["Authorization"] = f"Bearer {config.token}"
    return httpx.Client(base_url=config.api_url, timeout=30, headers=headers)


@app.command("list", help="List volumes.")
def list_volumes(
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        params = {"workspace_id": workspace_id} if workspace_id else None
        response = client.get("/v1/volumes", params=params)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    print_table(
        data, ["volume_id", "name", "workspace_id", "size_gb", "volume_type", "status", "created_at"],
        title="Volumes",
        json_output=json_output,
    )


@app.command("create", help="Create a volume.")
def create_volume(
    name: str = typer.Argument(..., help="Volume name."),
    size_gb: int = typer.Option(10, "--size-gb", help="Size in GB."),
    volume_type: str = typer.Option("object-storage", "--type", help="Volume type."),
    workspace_id: str | None = typer.Option(None, "--workspace-id", help="Workspace ID."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    ws = workspace_id or config.workspace_id
    if not ws:
        raise typer.BadParameter("No workspace set.")
    client = _client(config)
    try:
        payload = {
            "workspace_id": ws,
            "name": name,
            "size_gb": size_gb,
            "volume_type": volume_type,
        }
        response = client.post("/v1/volumes", json=payload)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    rprint(f"[green]✓[/green] Created volume [bold]{data['volume_id']}[/bold] ({data['name']}).")


@app.command("delete", help="Delete a volume.")
def delete_volume(
    workspace_id: str = typer.Argument(..., help="Workspace ID."),
    locator: str = typer.Argument(..., help="Volume ID or name."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete volume {locator} in workspace {workspace_id}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/volumes/{workspace_id}/{locator}")
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted volume {locator}.")


@app.command("ls", help="List entries in a volume.")
def volume_ls(
    locator: str = typer.Argument(..., help="Volume ID or name."),
    path: str = typer.Option("", "--path", "-p", help="Prefix path."),
    json_output: bool = typer.Option(False, "--json", help="Output as JSON."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    client = _client(config)
    try:
        response = client.get(f"/v1/volumes/{locator}/entries", params={"prefix": path} if path else None)
        raise_for_status(response)
        data = response.json()
    finally:
        client.close()
    print_table(data, ["path", "entry_type", "size"], title=f"Volume {locator}", json_output=json_output)


@app.command("put", help="Upload a file into a volume.")
def volume_put(
    locator: str = typer.Argument(..., help="Volume ID or name."),
    local_path: Path = typer.Argument(..., exists=True, help="Local file path."),
    remote_path: str | None = typer.Option(None, "--remote-path", help="Remote path in volume."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    dest = remote_path or local_path.name
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
        progress.add_task(f"Uploading {local_path}...", total=None)
        client = _client(config)
        try:
            data_bytes = local_path.read_bytes()
            response = client.put(f"/v1/volumes/{locator}/blob", params={"path": dest}, content=data_bytes)
            raise_for_status(response)
            data = response.json()
        finally:
            client.close()
    rprint(f"[green]✓[/green] Uploaded to {data.get('path', dest)}.")


@app.command("get", help="Download a file from a volume.")
def volume_get(
    locator: str = typer.Argument(..., help="Volume ID or name."),
    remote_path: str = typer.Argument(..., help="Remote path in volume."),
    local_path: Path | None = typer.Argument(None, help="Local destination path."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    dest = local_path or Path(remote_path.rsplit("/", 1)[-1])
    client = _client(config)
    try:
        response = client.get(f"/v1/volumes/{locator}/blob", params={"path": remote_path})
        raise_for_status(response)
    finally:
        client.close()
    dest.write_bytes(response.content)
    rprint(f"[green]✓[/green] Downloaded to {dest}.")


@app.command("rm", help="Delete a file from a volume.")
def volume_rm(
    locator: str = typer.Argument(..., help="Volume ID or name."),
    remote_path: str = typer.Argument(..., help="Remote path in volume."),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if not confirm(f"Delete {remote_path} from volume {locator}?", force=force):
        raise typer.Exit(0)
    client = _client(config)
    try:
        response = client.delete(f"/v1/volumes/{locator}/blob", params={"path": remote_path})
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Deleted {remote_path}.")


@app.command("cp", help="Copy a file between volumes.")
def volume_cp(
    source: str = typer.Argument(..., help="Source volume:path."),
    destination: str = typer.Argument(..., help="Destination volume:path."),
    api_url: str | None = typer.Option(None, "--api-url", help="Override the API URL."),
    token: str | None = typer.Option(None, "--token", help="Override the API token."),
) -> None:
    config = get_config(api_url=api_url, token=token)
    config.require_token()
    if ":" not in source or ":" not in destination:
        raise typer.BadParameter("Source and destination must be in the form volume:path.")
    src_vol, src_path = source.split(":", 1)
    dst_vol, dst_path = destination.split(":", 1)
    client = _client(config)
    try:
        response = client.get(f"/v1/volumes/{src_vol}/blob", params={"path": src_path})
        raise_for_status(response)
        response = client.put(f"/v1/volumes/{dst_vol}/blob", params={"path": dst_path}, content=response.content)
        raise_for_status(response)
    finally:
        client.close()
    rprint(f"[green]✓[/green] Copied {source} -> {destination}.")
