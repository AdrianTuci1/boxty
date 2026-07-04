"""Configuration handling for the Boxty CLI.

Precedence (highest to lowest):
1. CLI flags
2. Environment variables
3. Config file (`~/.boxty/config.json`)
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from pydantic import BaseModel, Field

from .exceptions import ConfigError

CONFIG_DIR = Path.home() / ".boxty"
CONFIG_PATH = CONFIG_DIR / "config.json"


class Profile(BaseModel):
    name: str
    api_url: str = "http://127.0.0.1:8080"
    token: str | None = None
    workspace_id: str | None = None
    environment_id: str | None = None


class ConfigFile(BaseModel):
    active_profile: str = "default"
    profiles: dict[str, Profile] = Field(default_factory=lambda: {"default": Profile(name="default")})


class Config:
    """Resolved config with precedence applied."""

    def __init__(
        self,
        api_url: str | None = None,
        token: str | None = None,
        workspace_id: str | None = None,
        environment_id: str | None = None,
    ) -> None:
        self._file_config = self._load_file()
        self._active = self._file_config.profiles.get(
            self._file_config.active_profile,
            Profile(name=self._file_config.active_profile),
        )

        self.api_url = self._resolve(
            api_url,
            os.environ.get("BOXTY_API_URL"),
            self._active.api_url,
        )
        self.token = self._resolve(
            token,
            os.environ.get("BOXTY_TOKEN"),
            self._active.token,
        )
        self.workspace_id = self._resolve(
            workspace_id,
            os.environ.get("BOXTY_WORKSPACE_ID"),
            self._active.workspace_id,
        )
        self.environment_id = self._resolve(
            environment_id,
            os.environ.get("BOXTY_ENVIRONMENT_ID"),
            self._active.environment_id,
        )

    @staticmethod
    def _resolve(flag: str | None, env: str | None, file: str | None) -> str | None:
        return flag if flag is not None else (env if env is not None else file)

    @classmethod
    def _load_file(cls) -> ConfigFile:
        if not CONFIG_PATH.exists():
            return ConfigFile()
        try:
            with CONFIG_PATH.open("r", encoding="utf-8") as f:
                data = json.load(f)
            return ConfigFile.model_validate(data)
        except Exception as exc:
            raise ConfigError(f"Failed to load config from {CONFIG_PATH}: {exc}") from exc

    def save(self) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        self._active.api_url = self.api_url
        self._active.token = self.token
        self._active.workspace_id = self.workspace_id
        self._active.environment_id = self.environment_id
        self._file_config.profiles[self._active.name] = self._active
        with CONFIG_PATH.open("w", encoding="utf-8") as f:
            json.dump(self._file_config.model_dump(), f, indent=2)

    def require_token(self) -> str:
        if not self.token:
            raise ConfigError("Not authenticated. Run `boxty auth login` first.")
        return self.token


def get_config(
    api_url: str | None = None,
    token: str | None = None,
    workspace_id: str | None = None,
    environment_id: str | None = None,
) -> Config:
    return Config(api_url, token, workspace_id, environment_id)
