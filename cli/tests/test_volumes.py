
"""Tests for volume commands."""

from unittest.mock import patch

from typer.testing import CliRunner

from boxty_cli.main import app

runner = CliRunner()


def test_volume_list(logged_in_config):
    volumes = [
        {"volume_id": "vol_1", "name": "data", "volume_type": "object-storage", "size_gb": 10},
    ]
    with patch("boxty_cli.volumes.Boxty") as MockBoxty:
        client = MockBoxty.return_value
        client.volumes.list.return_value = volumes
        result = runner.invoke(app, ["volume", "list"])
    assert result.exit_code == 0
    assert "data" in result.output


def test_volume_create(logged_in_config):
    with patch("boxty_cli.volumes.Boxty") as MockBoxty:
        client = MockBoxty.return_value
        client.volumes.create.return_value = {"volume_id": "vol_1", "name": "data"}
        result = runner.invoke(app, ["volume", "create", "data", "--size", "20"])
    assert result.exit_code == 0
    assert "Created volume" in result.output


def test_volume_ls(logged_in_config):
    entries = [{"path": "/data.txt", "entry_type": "file", "size": 1024}]
    with patch("boxty_cli.volumes.Boxty") as MockBoxty:
        client = MockBoxty.return_value
        client.volumes.list_entries.return_value = entries
        result = runner.invoke(app, ["volume", "ls", "vol_1"])
    assert result.exit_code == 0
    assert "/data.txt" in result.output
