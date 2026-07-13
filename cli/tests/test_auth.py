
"""Tests for authentication commands."""

from unittest.mock import patch

from typer.testing import CliRunner

from boxty_cli.auth import login_web
from boxty_cli.config import load_config
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


def test_login_web(temp_config):
    with patch("boxty_cli.auth.Boxty.device_code", return_value={
        "device_code": "dev_123",
        "user_code": "ABC123",
        "verification_uri": "http://web.boxty/auth/device",
        "verification_uri_complete": "http://web.boxty/auth/device?user_code=ABC123",
        "expires_in": 600,
        "interval": 0.1,
    }):
        with patch("boxty_cli.auth.Boxty.device_token", return_value={
            "status": "authorized",
            "user_id": "usr_123",
            "access_token": "tok_123",
        }):
            result = runner.invoke(app, ["auth", "login-web", "--no-open-browser"])
    assert result.exit_code == 0
    assert "http://web.boxty/auth/device?user_code=ABC123" in result.output
    assert "User code: ABC123" in result.output
    assert "Logged in" in result.output
    config = load_config()
    assert config.token == "tok_123"
    assert config.user_id == "usr_123"


def test_login_web_prompt(temp_config):
    with patch("boxty_cli.auth.Boxty.device_code", return_value={
        "device_code": "dev_123",
        "user_code": "ABC123",
        "verification_uri": "http://web.boxty/auth/device",
        "verification_uri_complete": "http://web.boxty/auth/device?user_code=ABC123",
        "expires_in": 600,
        "interval": 0.1,
    }):
        result = runner.invoke(app, ["auth", "login-web", "--no-open-browser", "--prompt"], input="tok_pasted\n")
    assert result.exit_code == 0
    assert "Paste the access token here" in result.output
    assert "Token saved" in result.output
    config = load_config()
    assert config.token == "tok_pasted"
