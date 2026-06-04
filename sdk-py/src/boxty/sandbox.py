from __future__ import annotations
from typing import Any, List, Optional, Callable
from contextlib import contextmanager
import json
import threading
import websocket

class Sandbox:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data
        self._listeners: dict[str, List[Callable]] = {}
        self._ws = None
        self._ws_thread = None

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
        if event not in self._listeners:
            self._listeners[event] = []
        self._listeners[event].append(callback)
        self._ensure_ws()

    def _ensure_ws(self):
        if self._ws and self._ws.sock and self._ws.sock.connected:
            return
        ws_url = self.ws_url or f"ws://localhost:9002/{self.id}"
        self._ws = websocket.WebSocketApp(
            ws_url,
            on_message=self._on_ws_message,
            on_error=lambda ws, err: print(f"WS error: {err}"),
            on_close=lambda ws: print("WS closed"),
        )
        self._ws_thread = threading.Thread(target=self._ws.run_forever, daemon=True)
        self._ws_thread.start()

    def _on_ws_message(self, ws, message):
        try:
            data = json.loads(message)
            event = data.get("event", "stdout")
            for cb in self._listeners.get(event, []):
                cb(data.get("data", ""))
        except Exception:
            for cb in self._listeners.get("stdout", []):
                cb(message)
