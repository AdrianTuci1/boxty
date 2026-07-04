
"""Tests for config commands."""

from typer.testing import CliRunner

from boxty_cli.main import app

runner = CliRunner()


def test_config_show(logged_in_config):
    result = runner.invoke(app, ["config", "show"])
    assert result.exit_code == 0
    assert "http://test.boxty" in result.output
    assert "ws_123" in result.output


def test_config_set_environment(logged_in_config):
    result = runner.invoke(app, ["config", "set-environment", "prod"])
    assert result.exit_code == 0
    assert "Set environment" in result.output
