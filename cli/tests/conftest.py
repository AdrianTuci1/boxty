
"""Shared fixtures for CLI tests."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock

import pytest

from boxty_cli.config import BoxtyConfig, CONFIG_FILE, save_config


@pytest.fixture
def temp_config():
    """Use a temporary config directory."""
    with tempfile.TemporaryDirectory() as tmp:
        original = BoxtyConfig.__bases__
        config_file = Path(tmp) / "config.json"
        # monkeypatch config paths in config module
        from boxty_cli import config as config_module
        original_dir = config_module.CONFIG_DIR
        original_file = config_module.CONFIG_FILE
        config_module.CONFIG_DIR = Path(tmp)
        config_module.CONFIG_FILE = config_file
        yield config_file
        config_module.CONFIG_DIR = original_dir
        config_module.CONFIG_FILE = original_file


@pytest.fixture
def logged_in_config(temp_config):
    """Config with a token set."""
    cfg = BoxtyConfig(api_url="http://test.boxty", token="tok_123", user_id="usr_123", workspace_id="ws_123", environment_id="env_123")
    save_config(cfg)
    return cfg


@pytest.fixture
def mock_response():
    def _mock_response(status_code=200, json_data=None):
        mock = Mock()
        mock.status_code = status_code
        mock.json.return_value = json_data or {}
        mock.raise_for_status.return_value = None
        mock.content = b""
        return mock
    return _mock_response
