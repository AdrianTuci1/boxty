"""Tests for workspace CLI commands."""
from unittest.mock import patch, MagicMock

from typer.testing import CliRunner

from boxty_cli.main import app

runner = CliRunner()


def _mock_client(**methods):
    client = MagicMock()
    for name, value in methods.items():
        parts = name.split(".")
        target = client
        for part in parts[:-1]:
            target = getattr(target, part)
        getattr(target, parts[-1]).return_value = value
    return client

def test_workspaces_list(logged_in_config):
    client = _mock_client(workspaces=[{"workspace_id": "ws_1", "name": "acme", "owner_id": "usr_1"}])
    with patch("boxty_cli.workspaces.Boxty", return_value=client):
        result = runner.invoke(app, ["workspace", "list"])
    assert result.exit_code == 0
    assert "ws_1" in result.output


def test_workspaces_create(logged_in_config):
    client = _mock_client(create_workspace={"workspace_id": "ws_2", "name": "acme"})
    with patch("boxty_cli.workspaces.Boxty", return_value=client):
        result = runner.invoke(app, ["workspace", "create", "acme"])
    assert result.exit_code == 0
    assert "ws_2" in result.output

