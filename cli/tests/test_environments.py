"""Tests for environment CLI commands."""
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

def test_environments_list(logged_in_config):
    client = _mock_client(environments=[{"environment_id": "env_1", "name": "prod", "workspace_id": "ws_123"}])
    with patch("boxty_cli.environments.Boxty", return_value=client):
        result = runner.invoke(app, ["environment", "list"])
    assert result.exit_code == 0
    assert "env_1" in result.output


def test_environments_create(logged_in_config):
    client = _mock_client(create_environment={"environment_id": "env_2", "name": "staging"})
    with patch("boxty_cli.environments.Boxty", return_value=client):
        result = runner.invoke(app, ["environment", "create", "staging"])
    assert result.exit_code == 0
    assert "env_2" in result.output

