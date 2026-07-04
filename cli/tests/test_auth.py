"""Tests for auth commands."""
from __future__ import annotations

from click.testing import CliRunner
from httpx import Response
from typer.main import get_command

from boxty_cli.main import app


def test_whoami(respx_mock):
    respx_mock.get("http://localhost:8080/v1/auth/me").mock(return_value=Response(200, json={
        "user_id": "usr_1",
        "email": "a@b.com",
        "workspace_id": "ws_1",
    }))
    runner = CliRunner()
    result = runner.invoke(get_command(app), ["auth", "whoami", "--token", "tok", "--api-url", "http://localhost:8080"])
    assert result.exit_code == 0, result.output
    assert "usr_1" in result.output


def test_login(respx_mock, tmp_path, monkeypatch):
    config_path = tmp_path / "config.json"
    monkeypatch.setattr("boxty_cli.config.CONFIG_PATH", config_path)
    monkeypatch.setattr("boxty_cli.config.CONFIG_DIR", config_path.parent)
    respx_mock.get("http://localhost:8080/v1/auth/me").mock(return_value=Response(200, json={
        "user_id": "usr_1",
        "email": "a@b.com",
        "workspace_id": "ws_1",
    }))
    runner = CliRunner()
    result = runner.invoke(get_command(app), ["auth", "login", "--token", "tok", "--api-url", "http://localhost:8080"])
    assert result.exit_code == 0, result.output
    assert "Authenticated" in result.output
