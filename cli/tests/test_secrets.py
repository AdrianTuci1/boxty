"""Tests for secret CLI commands."""
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

def test_secrets_list(logged_in_config):
    client = _mock_client(**{"secrets.list": [{"secret_id": "sec_1", "name": "openai", "workspace_id": "ws_123"}]})
    with patch("boxty_cli.secrets.Boxty", return_value=client):
        result = runner.invoke(app, ["secret", "list"])
    assert result.exit_code == 0
    assert "openai" in result.output


def test_secrets_create(logged_in_config):
    client = _mock_client(**{"secrets.create": {"name": "openai"}})
    with patch("boxty_cli.secrets.Boxty", return_value=client):
        result = runner.invoke(app, ["secret", "create", "openai", "KEY=value"])
    assert result.exit_code == 0
    assert "openai" in result.output


def test_secrets_delete(logged_in_config):
    client = _mock_client(**{"secrets.delete": {"deleted": True}})
    with patch("boxty_cli.secrets.Boxty", return_value=client):
        result = runner.invoke(app, ["secret", "delete", "openai", "--yes"])
    assert result.exit_code == 0
    assert "Deleted" in result.output

