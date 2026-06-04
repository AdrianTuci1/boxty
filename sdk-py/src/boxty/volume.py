from typing import Any

class Volume:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data

    def __getattr__(self, name: str) -> Any:
        return self._data.get(name)

    def delete(self) -> None:
        self._client.delete_volume(self.id)
