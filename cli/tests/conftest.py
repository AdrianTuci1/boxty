"""Test fixtures."""
from __future__ import annotations

import tempfile
from pathlib import Path

import pytest
from httpx import Response

from boxty_cli.config import ConfigFile, Profile


@pytest.fixture(autouse=True)
def isolated_config(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp:
        config_path = Path(tmp) / "config.json"
        monkeypatch.setattr("boxty_cli.config.CONFIG_PATH", config_path)
        monkeypatch.setattr("boxty_cli.config.CONFIG_DIR", config_path.parent)
        config_path.parent.mkdir(parents=True, exist_ok=True)
        yield


@pytest.fixture
def mock_api(respx_mock):
    """A respx mock router with common endpoints."""
    respx_mock.get("/v1/auth/me").mock(return_value=Response(200, json={
        "user_id": "usr_test",
        "email": "test@example.com",
        "workspace_id": "ws_test",
    }))
    return respx_mock


@pytest.fixture
def sample_config():
    cfg = ConfigFile(
        active_profile="default",
        profiles={
            "default": Profile(
                name="default",
                api_url="http://localhost:8080",
                token="test-token",
                workspace_id="ws_test",
                environment_id="env_test",
            )
        },
    )
    cfg.save = lambda: None
    return cfg
