"""Boxty CLI configuration management."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


CONFIG_DIR = Path.home() / ".boxty"
CONFIG_FILE = CONFIG_DIR / "config.json"


def _as_path(value: str | Path) -> Path:
    return Path(value) if isinstance(value, str) else value

DEFAULT_API_URL = "http://localhost:8000"


class BoxtyConfig(BaseModel):
    """Persistent CLI configuration."""

    api_url: str = DEFAULT_API_URL
    token: str | None = None
    user_id: str | None = None
    workspace_id: str | None = None
    environment_id: str | None = None
    environment: str | None = None
    active_profile: str = "default"
    profiles: dict[str, dict[str, Any]] = Field(default_factory=dict)

    def merge_env(self) -> "BoxtyConfig":
        """Apply environment variable overrides."""
        if os.environ.get("BOXTY_API_URL"):
            self.api_url = os.environ["BOXTY_API_URL"]
        if os.environ.get("BOXTY_TOKEN"):
            self.token = os.environ["BOXTY_TOKEN"]
        if os.environ.get("BOXTY_WORKSPACE_ID"):
            self.workspace_id = os.environ["BOXTY_WORKSPACE_ID"]
        if os.environ.get("BOXTY_ENVIRONMENT_ID"):
            self.environment_id = os.environ["BOXTY_ENVIRONMENT_ID"]
        return self

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump()

    def save(self) -> None:
        save_config(self)


def _ensure_dir() -> None:
    config_dir = _as_path(CONFIG_DIR)
    config_dir.mkdir(parents=True, exist_ok=True)
    config_file = _as_path(CONFIG_FILE)
    if config_file.exists():
        config_file.chmod(0o600)


def load_config() -> BoxtyConfig:
    _ensure_dir()
    config_file = _as_path(CONFIG_FILE)
    if config_file.exists():
        data = json.loads(config_file.read_text())
    else:
        data = {}
    cfg = BoxtyConfig.model_validate(data)
    cfg.merge_env()
    return cfg


def save_config(cfg: BoxtyConfig) -> None:
    _ensure_dir()
    config_file = _as_path(CONFIG_FILE)
    config_file.write_text(json.dumps(cfg.to_dict(), indent=2))
    config_file.chmod(0o600)


def get_config() -> BoxtyConfig:
    return load_config()
