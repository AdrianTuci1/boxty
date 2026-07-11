"""Tests for profile CLI commands."""
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

def test_profile_current(logged_in_config):
    result = runner.invoke(app, ["profile", "current"])
    assert result.exit_code == 0
    assert "default" in result.output


def test_profile_activate(logged_in_config):
    result = runner.invoke(app, ["profile", "activate", "prod"])
    assert result.exit_code == 0
    assert "prod" in result.output

