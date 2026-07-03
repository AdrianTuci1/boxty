from __future__ import annotations

import os
from pathlib import Path


class CliConfig:
    def __init__(self) -> None:
        self.config_dir = Path(os.environ.get("BOXTY_CONFIG_DIR", Path.home() / ".boxty"))
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.token = os.environ.get("BOXTY_TOKEN", "")

    def save(self) -> None:
        pass
