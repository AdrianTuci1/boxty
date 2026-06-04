from typing import Any

class Secret:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data

    @property
    def name(self) -> str:
        return self._data.get("name")

    @property
    def created_at(self) -> str:
        return self._data.get("created_at")
