"""Tests for config precedence."""
from __future__ import annotations

import pytest

from boxty_cli.config import Config, get_config


def test_config_file_defaults(tmp_path, monkeypatch):
    config_path = tmp_path / "config.json"
    config_path.write_text('{"active_profile": "default", "profiles": {"default": {"name": "default", "api_url": "http://file"}}}')
    monkeypatch.setattr("boxty_cli.config.CONFIG_PATH", config_path)
    cfg = get_config()
    assert cfg.api_url == "http://file"
    assert cfg.token is None


def test_config_env_overrides_file(tmp_path, monkeypatch):
    config_path = tmp_path / "config.json"
    config_path.write_text('{"active_profile": "default", "profiles": {"default": {"name": "default", "api_url": "http://file"}}}')
    monkeypatch.setattr("boxty_cli.config.CONFIG_PATH", config_path)
    monkeypatch.setenv("BOXTY_API_URL", "http://env")
    cfg = get_config()
    assert cfg.api_url == "http://env"


def test_config_flag_overrides_env(tmp_path, monkeypatch):
    config_path = tmp_path / "config.json"
    config_path.write_text('{"active_profile": "default", "profiles": {"default": {"name": "default", "api_url": "http://file"}}}')
    monkeypatch.setattr("boxty_cli.config.CONFIG_PATH", config_path)
    monkeypatch.setenv("BOXTY_API_URL", "http://env")
    cfg = get_config(api_url="http://flag")
    assert cfg.api_url == "http://flag"


def test_require_token_raises_when_missing():
    cfg = Config()
    cfg.token = None
    with pytest.raises(Exception):
        cfg.require_token()
