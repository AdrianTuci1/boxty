
"""Tests for app commands."""

import tempfile
from pathlib import Path
from unittest.mock import patch

from typer.testing import CliRunner

from boxty_cli.main import app

runner = CliRunner()


def test_app_list(logged_in_config):
    workloads = [
        {"workload_id": "wl_1", "name": "hello", "status": "running", "image": "python:3.11"},
    ]
    with patch("boxty_cli.apps.Boxty.list_workloads", return_value=workloads):
        result = runner.invoke(app, ["app", "list"])
    assert result.exit_code == 0
    assert "hello" in result.output


def test_app_list_json(logged_in_config):
    workloads = [
        {"workload_id": "wl_1", "name": "hello", "status": "running", "image": "python:3.11"},
    ]
    with patch("boxty_cli.apps.Boxty.list_workloads", return_value=workloads):
        result = runner.invoke(app, ["app", "list", "--json"])
    assert result.exit_code == 0
    assert "wl_1" in result.output


def test_app_deploy(logged_in_config):
    with tempfile.TemporaryDirectory() as tmp:
        app_file = Path(tmp) / "app.py"
        app_file.write_text("""
import boxty
app = boxty.App("test")
@app.function()
def hello():
    print("hello")
""")
        deploy_result = {
            "app_name": "test",
            "workloads": ["wl_1"],
        }
        with patch("boxty.app.App.deploy", return_value=deploy_result):
            result = runner.invoke(app, ["app", "deploy", str(app_file)])
    assert result.exit_code == 0
    assert "Deployed app" in result.output
