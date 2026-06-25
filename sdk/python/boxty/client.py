from __future__ import annotations

import os
from typing import Any

import httpx

from .secrets import SecretsClient
from .volumes import VolumesClient
from .databases import DatabasesClient


class Boxty:
    """Root client for the Boxty platform SDK.

    Auto-discovers the gateway URL from the ``BOXTY_GATEWAY_URL``
    environment variable (set automatically by ``boxty deploy`` /
    ``boxty run``).  Falls back to ``http://127.0.0.1:8080`` for local
    development.
    """

    def __init__(self, base_url: str | None = None) -> None:
        self._base = (base_url or os.environ.get("BOXTY_GATEWAY_URL") or "http://127.0.0.1:8080").rstrip("/")
        self._http = httpx.Client(base_url=self._base, timeout=30)

    # -- sub-clients ----------------------------------------------------------

    @property
    def secrets(self) -> SecretsClient:
        return SecretsClient(self._http, self._base)

    @property
    def volumes(self) -> VolumesClient:
        return VolumesClient(self._http, self._base)

    @property
    def databases(self) -> DatabasesClient:
        return DatabasesClient(self._http, self._base)

    # -- app state ------------------------------------------------------------

    def state(self) -> dict[str, Any]:
        r = self._http.get("/api/cli/state")
        r.raise_for_status()
        return r.json()

    # -- centralized control plane ------------------------------------------

    def signup(self, external_user_id: str, email: str | None = None, organization_id: str | None = None) -> dict[str, Any]:
        r = self._http.post(
            "/v1/auth/register",
            json={
                "external_user_id": external_user_id,
                "email": email,
                "organization_id": organization_id,
            },
        )
        r.raise_for_status()
        return r.json()

    def balance(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/accounts/{user_id}")
        r.raise_for_status()
        return r.json()

    def workspaces(self, owner_id: str | None = None) -> list[dict[str, Any]]:
        r = self._http.get("/v1/workspaces", params={"owner_id": owner_id} if owner_id else None)
        r.raise_for_status()
        return r.json()

    def create_workspace(self, owner_id: str, name: str) -> dict[str, Any]:
        r = self._http.post("/v1/workspaces", json={"owner_id": owner_id, "name": name})
        r.raise_for_status()
        return r.json()

    def environments(self, workspace_id: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/v1/workspaces/{workspace_id}/environments")
        r.raise_for_status()
        return r.json()

    def create_environment(self, workspace_id: str, name: str) -> dict[str, Any]:
        r = self._http.post("/v1/environments", json={"workspace_id": workspace_id, "name": name})
        r.raise_for_status()
        return r.json()

    def api_keys(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        r = self._http.get("/v1/api-keys", params={"workspace_id": workspace_id} if workspace_id else None)
        r.raise_for_status()
        return r.json()

    def create_api_key(self, owner_id: str, workspace_id: str, environment_id: str, name: str) -> dict[str, Any]:
        r = self._http.post(
            "/v1/api-keys",
            json={
                "owner_id": owner_id,
                "workspace_id": workspace_id,
                "environment_id": environment_id,
                "name": name,
            },
        )
        r.raise_for_status()
        return r.json()

    def pricing(self) -> dict[str, Any]:
        r = self._http.get("/v1/pricing")
        r.raise_for_status()
        return r.json()

    def create_workload(
        self,
        owner_id: str,
        workspace_id: str,
        environment_id: str,
        kind: str,
        image: str,
        *,
        command: list[str] | None = None,
        region: str | None = None,
        pool: str | None = None,
        endpoint_name: str | None = None,
        requested_backend: str | None = None,
        cpu_cores: int = 1,
        memory_mb: int = 512,
        disk_gb: int = 2,
        gpu_count: int = 0,
        gpu_type: str | None = None,
    ) -> dict[str, Any]:
        r = self._http.post(
            "/v1/workloads",
            json={
                "owner_id": owner_id,
                "workspace_id": workspace_id,
                "environment_id": environment_id,
                "kind": kind,
                "image": image,
                "command": command or [],
                "region": region,
                "pool": pool,
                "endpoint_name": endpoint_name,
                "requested_backend": requested_backend,
                "resources": {
                    "cpu_cores": cpu_cores,
                    "memory_mb": memory_mb,
                    "disk_gb": disk_gb,
                    "gpu_count": gpu_count,
                    "gpu_type": gpu_type,
                },
            },
        )
        r.raise_for_status()
        return r.json()

    def list_workloads(self) -> list[dict[str, Any]]:
        r = self._http.get("/v1/workloads")
        r.raise_for_status()
        return r.json()

    def create_sandbox_session(self, workload_id: str, requester_id: str, ttl_seconds: int = 900) -> dict[str, Any]:
        r = self._http.post(
            "/v1/sandbox-sessions",
            json={
                "workload_id": workload_id,
                "requester_id": requester_id,
                "ttl_seconds": ttl_seconds,
            },
        )
        r.raise_for_status()
        return r.json()

    def meter_usage(
        self,
        workload_id: str,
        *,
        cpu_seconds: float = 0.0,
        ram_gb_seconds: float = 0.0,
        gpu_seconds: float = 0.0,
        storage_gb_seconds: float = 0.0,
    ) -> dict[str, Any]:
        r = self._http.post(
            "/v1/usage/meter",
            json={
                "workload_id": workload_id,
                "cpu_seconds": cpu_seconds,
                "ram_gb_seconds": ram_gb_seconds,
                "gpu_seconds": gpu_seconds,
                "storage_gb_seconds": storage_gb_seconds,
            },
        )
        r.raise_for_status()
        return r.json()
