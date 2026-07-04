"""Shared CLI utilities."""
from __future__ import annotations

import json
from typing import Any

import httpx
import typer
from rich.console import Console
from rich.table import Table

console = Console()


def print_table(
    rows: list[dict[str, Any]],
    columns: list[str],
    *,
    title: str | None = None,
    json_output: bool = False,
) -> None:
    if json_output:
        typer.echo(json.dumps(rows, indent=2, default=str))
        return

    if not rows:
        console.print("[dim]No items found.[/dim]")
        return

    table = Table(title=title)
    for col in columns:
        table.add_column(col, overflow="fold")
    for row in rows:
        table.add_row(*[str(row.get(col, "")) for col in columns])
    console.print(table)


def raise_for_status(response: httpx.Response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = response.text or str(exc)
        try:
            payload = response.json()
            detail = payload.get("detail", payload)
        except Exception:
            pass
        raise typer.BadParameter(f"API error {response.status_code}: {detail}") from exc


def confirm(message: str, *, force: bool = False) -> bool:
    if force:
        return True
    return typer.confirm(message, default=False)
