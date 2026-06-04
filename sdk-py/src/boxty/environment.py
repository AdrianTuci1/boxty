from typing import Any

class Environment:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data

    def __getattr__(self, name: str) -> Any:
        return self._data.get(name)

    def delete(self) -> None:
        self._client._request("DELETE", f"/api/environments/{self.id}")
