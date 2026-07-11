"""Tests for app CLI commands."""
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

def test_apps_list(logged_in_config):
    client = _mock_client(list_workloads=[{"workload_id": "wl_1", "name": "api", "status": "running", "image": "python"}])
    with patch("boxty_cli.apps.Boxty", return_value=client):
        result = runner.invoke(app, ["app", "list"])
    assert result.exit_code == 0
    assert "wl_1" in result.output


def test_apps_delete(logged_in_config):
    client = _mock_client(delete_workload={"deleted": True})
    with patch("boxty_cli.apps.Boxty", return_value=client):
        result = runner.invoke(app, ["app", "delete", "wl_1", "--yes"])
    assert result.exit_code == 0
    assert "Deleted" in result.output


def test_apps_stop(logged_in_config):
    client = _mock_client(update_workload_status={"workload_id": "wl_1", "status": "stopped"})
    with patch("boxty_cli.apps.Boxty", return_value=client):
        result = runner.invoke(app, ["app", "stop", "wl_1", "--yes"])
    assert result.exit_code == 0
    assert "Stopped" in result.output

