from __future__ import annotations

from typing import Any

import httpx


class SecretsClient:
    def __init__(self, http: httpx.Client, base: str) -> None:
        self._http = http
        self._base = base

    # -- list -----------------------------------------------------------------

    def list(self) -> list[dict[str, Any]]:
        r = self._http.get("/api/secrets")
        r.raise_for_status()
        return r.json()

    # -- create / update ------------------------------------------------------

    def create(self, name: str, env_vars: dict[str, str]) -> dict[str, Any]:
        payload = {
            "name": name,
            "envVars": [{"key": k, "value": v} for k, v in env_vars.items()],
        }
        r = self._http.post("/api/secrets", json=payload)
        r.raise_for_status()
        return r.json()

    # -- delete ---------------------------------------------------------------

    def delete(self, locator: str) -> bool:
        r = self._http.delete(f"/api/secrets/{locator}")
        r.raise_for_status()
        return r.json().get("deleted", False)
