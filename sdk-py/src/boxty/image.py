from __future__ import annotations
from typing import List, Optional

class Image:
    def __init__(self, base_image: str = "python:3.12-slim"):
        self.base_image = base_image
        self._commands: List[str] = []
        self._env: dict = {}
        self._copies: List[tuple] = []

    def pip_install(self, *packages: str) -> Image:
        self._commands.append(f"pip install {' '.join(packages)}")
        return self

    def apt_install(self, *packages: str) -> Image:
        self._commands.append(f"apt-get install -y {' '.join(packages)}")
        return self

    def env(self, **vars) -> Image:
        self._env.update(vars)
        return self

    def copy(self, source: str, dest: str) -> Image:
        self._copies.append((source, dest))
        return self

    def run(self, cmd: str) -> Image:
        self._commands.append(cmd)
        return self

    @classmethod
    def from_dockerfile(cls, path: str, context: str = ".") -> Image:
        inst = cls()
        inst._dockerfile = path
        inst._context = context
        return inst

    def build(self, name: Optional[str] = None) -> str:
        # Returns image URL stub
        return f"registry.boxty.dev/user/{name or 'image'}:latest"

    def build_async(self, name: Optional[str] = None):
        return {"id": "img-123", "status": "building"}
