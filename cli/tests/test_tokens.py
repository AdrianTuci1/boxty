"""Tests for token CLI commands."""
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

def test_tokens_set(logged_in_config):
    result = runner.invoke(app, ["token", "set", "tok_new"])
    assert result.exit_code == 0
    assert "saved" in result.output


def test_tokens_new(logged_in_config):
    client = _mock_client(create_api_key={"api_key_id": "key_1", "name": "ci", "token_value": "secret"})
    with patch("boxty_cli.tokens.Boxty", return_value=client):
        result = runner.invoke(app, ["token", "new", "ci"])
    assert result.exit_code == 0
    assert "key_1" in result.output

