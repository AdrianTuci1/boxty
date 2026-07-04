import pytest
from typer.testing import CliRunner

from boxty_cli.main import app
from boxty_cli.config import CONFIG_FILE, BoxtyConfig

runner = CliRunner()


@pytest.fixture(autouse=True)
def isolate_config(tmp_path, monkeypatch):
    config_file = tmp_path / "config.json"
    monkeypatch.setattr("boxty_cli.config.CONFIG_FILE", config_file)
    # No env vars
    for key in ("BOXTY_API_URL", "BOXTY_TOKEN", "BOXTY_WORKSPACE_ID", "BOXTY_ENVIRONMENT_ID"):
        monkeypatch.delenv(key, raising=False)


def test_profile_list_empty():
    result = runner.invoke(app, ["profile", "list"])
    assert result.exit_code == 0
    assert "No profiles configured" in result.output or "Active" in result.output


def test_profile_activate_creates_and_sets():
    result = runner.invoke(app, ["profile", "activate", "prod"])
    assert result.exit_code == 0
    assert "Activated profile" in result.output
    assert "prod" in result.output


def test_profile_current():
    runner.invoke(app, ["profile", "activate", "prod"])
    result = runner.invoke(app, ["profile", "current"])
    assert result.exit_code == 0
    assert "prod" in result.output
