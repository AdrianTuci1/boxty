
"""Tests for authentication commands."""

from unittest.mock import patch

from typer.testing import CliRunner

from boxty_cli.main import app


runner = CliRunner()


def test_login(temp_config, mock_response):
    with patch("boxty_cli.auth.Boxty.login", return_value={"user_id": "usr_123", "access_token": "tok_123"}):
        result = runner.invoke(app, ["auth", "login", "ext_123"])
    assert result.exit_code == 0
    assert "Logged in" in result.output


def test_logout(logged_in_config):
    result = runner.invoke(app, ["auth", "logout"])
    assert result.exit_code == 0
    assert "Logged out" in result.output


def test_whoami_not_logged_in(temp_config):
    result = runner.invoke(app, ["auth", "whoami"])
    assert result.exit_code == 1
    assert "Not logged in" in result.output


def test_whoami(logged_in_config):
    with patch("boxty_cli.auth.Boxty.whoami", return_value={"user_id": "usr_123", "email": "test@example.com"}):
        result = runner.invoke(app, ["auth", "whoami"])
    assert result.exit_code == 0
    assert "usr_123" in result.output
