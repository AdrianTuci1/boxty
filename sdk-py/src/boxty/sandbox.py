from __future__ import annotations
from typing import Any, List, Optional, Callable
from contextlib import contextmanager

class Sandbox:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data

    def __getattr__(self, name: str) -> Any:
        return self._data.get(name)

    @property
    def id(self) -> str:
        return self._data.get("id")

    @property
    def status(self) -> str:
        return self._data.get("status")

    @property
    def url(self) -> Optional[str]:
        return self._data.get("url")

    @property
    def ws_url(self) -> Optional[str]:
        return self._data.get("ws_url")

    def exec(self, command: str, timeout: int = 60) -> Any:
        return self._client._request("POST", f"/api/sandboxes/{self.id}/exec", json={"command": command, "timeout": timeout})

    @contextmanager
    def forward(self, port: int):
        data = self._client._request("POST", f"/api/sandboxes/{self.id}/forward", json={"port": port})
        yield data.get("url")

    def checkpoint(self, name: str) -> Any:
        return self._client._request("POST", f"/api/sandboxes/{self.id}/snapshot", json={"name": name})

    def stop(self) -> None:
        self._client._request("DELETE", f"/api/sandboxes/{self.id}")

    def metrics(self) -> Any:
        return self._client.get_sandbox_metrics(self.id)

    def attach_secrets(self, secret_names: List[str]) -> Any:
        return self._client.attach_secrets(self.id, secret_names)

    def on(self, event: str, callback: Callable) -> None:
        # Stub for WebSocket event handling
        pass
