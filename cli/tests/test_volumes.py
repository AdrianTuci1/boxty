"""Tests for volume CLI commands."""
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

def test_volumes_list(logged_in_config):
    client = _mock_client(**{"volumes.list": [{"volume_id": "vol_1", "name": "data", "volume_type": "object-storage", "size_gb": 10}]})
    with patch("boxty_cli.volumes.Boxty", return_value=client):
        result = runner.invoke(app, ["volume", "list"])
    assert result.exit_code == 0
    assert "vol_1" in result.output


def test_volumes_create(logged_in_config):
    client = _mock_client(**{"volumes.create": {"volume_id": "vol_1", "name": "data"}})
    with patch("boxty_cli.volumes.Boxty", return_value=client):
        result = runner.invoke(app, ["volume", "create", "data", "--size", "10"])
    assert result.exit_code == 0
    assert "vol_1" in result.output


def test_volumes_delete(logged_in_config):
    client = _mock_client(**{"volumes.delete": {"deleted": True}})
    with patch("boxty_cli.volumes.Boxty", return_value=client):
        result = runner.invoke(app, ["volume", "delete", "vol_1", "--yes"])
    assert result.exit_code == 0
    assert "Deleted" in result.output

