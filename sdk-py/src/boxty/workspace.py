from typing import Any, List
from .environment import Environment

class Workspace:
    def __init__(self, client, data: dict):
        self._client = client
        self._data = data

    def __getattr__(self, name: str) -> Any:
        return self._data.get(name)

    def environments(self) -> List[Environment]:
        return self._client.list_environments(self.id)

    def delete(self) -> None:
        self._client.delete_workspace(self.id)
