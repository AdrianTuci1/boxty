from __future__ import annotations

from typing import Any

import httpx


class SecretsClient:
    def __init__(self, http: httpx.Client, base: str) -> None:
        self._http = http
        self._base = base

    # -- list -----------------------------------------------------------------

    def list(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        r = self._http.get("/v1/secrets", params=params)
        r.raise_for_status()
        return r.json()

    # -- create / update ------------------------------------------------------

    def create(self, workspace_id: str, name: str, env_vars: dict[str, str]) -> dict[str, Any]:
        payload = {
            "workspace_id": workspace_id,
            "name": name,
            "env_vars": env_vars,
        }
        r = self._http.post("/v1/secrets", json=payload)
        r.raise_for_status()
        return r.json()

    def get(self, workspace_id: str, secret_name: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/secrets/{workspace_id}/{secret_name}")
        r.raise_for_status()
        return r.json()

    def update(self, workspace_id: str, secret_name: str, env_vars: dict[str, str]) -> dict[str, Any]:
        r = self._http.patch(f"/v1/secrets/{workspace_id}/{secret_name}", json={"env_vars": env_vars})
        r.raise_for_status()
        return r.json()

    # -- delete ---------------------------------------------------------------

    def delete(self, workspace_id: str, secret_name: str) -> bool:
        r = self._http.delete(f"/v1/secrets/{workspace_id}/{secret_name}")
        r.raise_for_status()
        return r.json().get("deleted", False)
