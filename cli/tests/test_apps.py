"""Tests for app commands."""
from __future__ import annotations

from click.testing import CliRunner
from httpx import Response
from typer.main import get_command

from boxty_cli.main import app


def test_app_list(respx_mock):
    respx_mock.get("http://localhost:8080/v1/workloads").mock(return_value=Response(200, json=[{
        "workload_id": "wl_1",
        "kind": "endpoint",
        "image": "python:3.11",
        "status": "running",
        "endpoint_name": "api",
        "created_at": "2024-01-01T00:00:00Z",
    }]))
    runner = CliRunner()
    result = runner.invoke(
        get_command(app),
        ["app", "list", "--token", "tok", "--api-url", "http://localhost:8080", "--json"],
    )
    assert result.exit_code == 0, result.output
    assert "wl_1" in result.output


def test_app_stop(respx_mock):
    resp = Response(200, json={"workload_id": "wl_1", "status": "running"})
    respx_mock.get("http://localhost:8080/v1/workloads/wl_1").mock(
        return_value=resp
    )
    resp = Response(200, json={"workload_id": "wl_1", "status": "stopped"})
    respx_mock.post(
        "http://localhost:8080/v1/workloads/wl_1/status",
        json={"status": "stopped"},
    ).mock(return_value=resp)
    runner = CliRunner()
    result = runner.invoke(
        get_command(app),
        ["app", "stop", "wl_1", "--force", "--token", "tok", "--api-url", "http://localhost:8080"],
    )
    assert result.exit_code == 0, result.output
    assert "Stopped" in result.output
