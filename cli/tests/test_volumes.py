"""Tests for volume commands."""
from __future__ import annotations

from click.testing import CliRunner
from httpx import Response
from typer.main import get_command

from boxty_cli.main import app


def test_volume_list(respx_mock):
    respx_mock.get("http://localhost:8080/v1/volumes").mock(return_value=Response(200, json=[{
        "volume_id": "vol_1",
        "name": "data",
        "workspace_id": "ws_1",
        "size_gb": 10,
        "volume_type": "object-storage",
        "status": "available",
        "created_at": "2024-01-01T00:00:00Z",
    }]))
    runner = CliRunner()
    result = runner.invoke(
        get_command(app),
        ["volume", "list", "--token", "tok", "--api-url", "http://localhost:8080", "--json"],
    )
    assert result.exit_code == 0, result.output
    assert "vol_1" in result.output


def test_volume_put_and_get(respx_mock, tmp_path):
    file = tmp_path / "hello.txt"
    file.write_text("hello")
    resp = Response(200, json={"path": "hello.txt"})
    respx_mock.put("http://localhost:8080/v1/volumes/vol_1/blob", params={"path": "hello.txt"}).mock(return_value=resp)
    resp = Response(200, content=b"hello")
    respx_mock.get("http://localhost:8080/v1/volumes/vol_1/blob", params={"path": "hello.txt"}).mock(return_value=resp)
    runner = CliRunner()
    result = runner.invoke(
        get_command(app),
        ["volume", "put", "vol_1", str(file), "--token", "tok", "--api-url", "http://localhost:8080"],
    )
    assert result.exit_code == 0, result.output
    assert "Uploaded" in result.output

    out = tmp_path / "out.txt"
    result = runner.invoke(
        get_command(app),
        ["volume", "get", "vol_1", "hello.txt", str(out), "--token", "tok", "--api-url", "http://localhost:8080"],
    )
    assert result.exit_code == 0, result.output
    assert out.read_text() == "hello"
