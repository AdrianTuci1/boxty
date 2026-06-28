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

    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        self._base = (base_url or os.environ.get("BOXTY_GATEWAY_URL") or "http://127.0.0.1:8080").rstrip("/")
        self._token = token
        self._http = httpx.Client(base_url=self._base, timeout=30)
        if self._token:
            self._http.headers["Authorization"] = f"Bearer {self._token}"

    # -- factory methods -------------------------------------------------------

    @classmethod
    def from_env(cls) -> Boxty:
        """Create a client from environment variables.

        Uses ``BOXTY_GATEWAY_URL`` for the base URL and
        ``BOXTY_TOKEN`` for the auth token.
        """
        return cls(
            base_url=os.environ.get("BOXTY_GATEWAY_URL"),
            token=os.environ.get("BOXTY_TOKEN"),
        )

    @classmethod
    def from_credentials(cls, email: str, password: str, base_url: str | None = None) -> Boxty:
        """Create a client and authenticate with email/password."""
        client = cls(base_url=base_url)
        # Note: password auth not yet implemented in backend
        # This is a placeholder for future implementation
        return client

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

    # -- state -----------------------------------------------------------------

    def state(self) -> dict[str, Any]:
        r = self._http.get("/api/cli/state")
        r.raise_for_status()
        return r.json()

    # -- auth ------------------------------------------------------------------

    def signup(self, external_user_id: str, email: str | None = None, organization_id: str | None = None) -> dict[str, Any]:
        payload = {
            "external_user_id": external_user_id,
            "email": email,
            "organization_id": organization_id,
        }
        r = self._http.post("/v1/auth/register", json=payload)
        r.raise_for_status()
        return r.json()

    def login(self, external_user_id: str, email: str | None = None) -> dict[str, Any]:
        r = self._http.post("/v1/auth/login", json={"external_user_id": external_user_id, "email": email})
        r.raise_for_status()
        return r.json()

    def whoami(self, token: str | None = None) -> dict[str, Any]:
        """Validate access token and return current user info."""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        r = self._http.get("/v1/auth/me", headers=headers or None)
        r.raise_for_status()
        return r.json()

    # -- accounts / users ------------------------------------------------------

    def get_account(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/accounts/{user_id}")
        r.raise_for_status()
        return r.json()

    def get_user(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/users/{user_id}")
        r.raise_for_status()
        return r.json()

    # -- workspaces -----------------------------------------------------------

    def workspaces(self, owner_id: str | None = None) -> list[dict[str, Any]]:
        params = {"owner_id": owner_id} if owner_id else None
        r = self._http.get("/v1/workspaces", params=params)
        r.raise_for_status()
        return r.json()

    def create_workspace(self, owner_id: str, name: str) -> dict[str, Any]:
        r = self._http.post("/v1/workspaces", json={"owner_id": owner_id, "name": name})
        r.raise_for_status()
        return r.json()

    def get_workspace(self, workspace_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/workspaces/{workspace_id}")
        r.raise_for_status()
        return r.json()

    def update_workspace(self, workspace_id: str, **kwargs: Any) -> dict[str, Any]:
        r = self._http.patch(f"/v1/workspaces/{workspace_id}", json=kwargs)
        r.raise_for_status()
        return r.json()

    def delete_workspace(self, workspace_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/workspaces/{workspace_id}")
        r.raise_for_status()
        return r.json()

    # -- environments ---------------------------------------------------------

    def environments(self, workspace_id: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/v1/workspaces/{workspace_id}/environments")
        r.raise_for_status()
        return r.json()

    def create_environment(self, workspace_id: str, name: str) -> dict[str, Any]:
        r = self._http.post("/v1/environments", json={"workspace_id": workspace_id, "name": name})
        r.raise_for_status()
        return r.json()

    def get_environment(self, environment_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/environments/{environment_id}")
        r.raise_for_status()
        return r.json()

    def update_environment(self, environment_id: str, **kwargs: Any) -> dict[str, Any]:
        r = self._http.patch(f"/v1/environments/{environment_id}", json=kwargs)
        r.raise_for_status()
        return r.json()

    def delete_environment(self, environment_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/environments/{environment_id}")
        r.raise_for_status()
        return r.json()

    # -- api keys -------------------------------------------------------------

    def api_keys(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        r = self._http.get("/v1/api-keys", params=params)
        r.raise_for_status()
        return r.json()

    def create_api_key(self, owner_id: str, workspace_id: str, environment_id: str, name: str) -> dict[str, Any]:
        r = self._http.post("/v1/api-keys", json={"owner_id": owner_id, "workspace_id": workspace_id, "environment_id": environment_id, "name": name})
        r.raise_for_status()
        return r.json()

    def get_api_key(self, api_key_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/api-keys/{api_key_id}")
        r.raise_for_status()
        return r.json()

    def update_api_key(self, api_key_id: str, **kwargs: Any) -> dict[str, Any]:
        r = self._http.patch(f"/v1/api-keys/{api_key_id}", json=kwargs)
        r.raise_for_status()
        return r.json()

    def delete_api_key(self, api_key_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/api-keys/{api_key_id}")
        r.raise_for_status()
        return r.json()

    # -- workloads ------------------------------------------------------------

    def create_workload(
        self,
        owner_id: str,
        workspace_id: str,
        environment_id: str,
        kind: str,
        image: str,
        command: list[str] | None = None,
        env: dict[str, str] | None = None,
        region: str | None = None,
        pool: str | None = None,
        endpoint_name: str | None = None,
        requested_backend: str | None = None,
        cpu_cores: int | None = None,
        memory_mb: int | None = None,
        disk_gb: int | None = None,
        gpu_count: int | None = None,
        gpu_type: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "owner_id": owner_id,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "kind": kind,
            "image": image,
        }
        if command is not None:
            payload["command"] = command
        if env is not None:
            payload["env"] = env
        if region is not None:
            payload["region"] = region
        if pool is not None:
            payload["pool"] = pool
        if endpoint_name is not None:
            payload["endpoint_name"] = endpoint_name
        if requested_backend is not None:
            payload["requested_backend"] = requested_backend
        if cpu_cores is not None:
            payload["cpu_cores"] = cpu_cores
        if memory_mb is not None:
            payload["memory_mb"] = memory_mb
        if disk_gb is not None:
            payload["disk_gb"] = disk_gb
        if gpu_count is not None:
            payload["gpu_count"] = gpu_count
        if gpu_type is not None:
            payload["gpu_type"] = gpu_type
        r = self._http.post("/v1/workloads", json=payload)
        r.raise_for_status()
        return r.json()

    def list_workloads(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params = {}
        if workspace_id is not None:
            params["workspace_id"] = workspace_id
        if environment_id is not None:
            params["environment_id"] = environment_id
        r = self._http.get("/v1/workloads", params=params)
        r.raise_for_status()
        return r.json()

    def get_workload(self, workload_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/workloads/{workload_id}")
        r.raise_for_status()
        return r.json()

    def update_workload(self, workload_id: str, **kwargs: Any) -> dict[str, Any]:
        r = self._http.patch(f"/v1/workloads/{workload_id}", json=kwargs)
        r.raise_for_status()
        return r.json()

    def update_workload_status(self, workload_id: str, status: str, runtime_details: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = {"status": status}
        if runtime_details is not None:
            payload["runtime_details"] = runtime_details
        r = self._http.post(f"/v1/workloads/{workload_id}/status", json=payload)
        r.raise_for_status()
        return r.json()

    def delete_workload(self, workload_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/workloads/{workload_id}")
        r.raise_for_status()
        return r.json()

    def get_workload_metrics(self, workload_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/workloads/{workload_id}/metrics")
        r.raise_for_status()
        return r.json()

    def get_workload_logs(self, workload_id: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/v1/workloads/{workload_id}/logs")
        r.raise_for_status()
        return r.json()

    def get_workload_launch_spec(self, workload_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/workloads/{workload_id}/launch-spec")
        r.raise_for_status()
        return r.json()

    # -- routes ---------------------------------------------------------------

    def list_routes(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params = {}
        if workspace_id is not None:
            params["workspace_id"] = workspace_id
        if environment_id is not None:
            params["environment_id"] = environment_id
        r = self._http.get("/v1/routes", params=params)
        r.raise_for_status()
        return r.json()

    def create_route(self, workload_id: str, endpoint_name: str) -> dict[str, Any]:
        r = self._http.post("/v1/routes", json={"workload_id": workload_id, "endpoint_name": endpoint_name})
        r.raise_for_status()
        return r.json()

    def get_route(self, route_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/routes/{route_id}")
        r.raise_for_status()
        return r.json()

    def delete_route(self, route_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/routes/{route_id}")
        r.raise_for_status()
        return r.json()

    # -- schedules ------------------------------------------------------------

    def list_schedules(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params = {}
        if workspace_id is not None:
            params["workspace_id"] = workspace_id
        if environment_id is not None:
            params["environment_id"] = environment_id
        r = self._http.get("/v1/schedules", params=params)
        r.raise_for_status()
        return r.json()

    def create_schedule(self, name: str, schedule_type: str, schedule_value: str, function_name: str, workspace_id: str, environment_id: str, image: str | None = None, cpu: str | None = None, memory: str | None = None, gpu: str | None = None) -> dict[str, Any]:
        payload = {
            "name": name,
            "schedule_type": schedule_type,
            "schedule_value": schedule_value,
            "function_name": function_name,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
        }
        if image is not None:
            payload["image"] = image
        if cpu is not None:
            payload["cpu"] = cpu
        if memory is not None:
            payload["memory"] = memory
        if gpu is not None:
            payload["gpu"] = gpu
        r = self._http.post("/v1/schedules", json=payload)
        r.raise_for_status()
        return r.json()

    def get_schedule(self, schedule_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/schedules/{schedule_id}")
        r.raise_for_status()
        return r.json()

    def update_schedule(self, schedule_id: str, **kwargs: Any) -> dict[str, Any]:
        r = self._http.patch(f"/v1/schedules/{schedule_id}", json=kwargs)
        r.raise_for_status()
        return r.json()

    def delete_schedule(self, schedule_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/schedules/{schedule_id}")
        r.raise_for_status()
        return r.json()

    def trigger_schedule(self, schedule_id: str) -> dict[str, Any]:
        r = self._http.post(f"/v1/schedules/{schedule_id}/trigger")
        r.raise_for_status()
        return r.json()

    # -- images ---------------------------------------------------------------

    def list_images(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        r = self._http.get("/v1/images", params=params)
        r.raise_for_status()
        return r.json()

    def build_image(self, name: str, dockerfile: str | None = None, base_image: str | None = None) -> dict[str, Any]:
        r = self._http.post("/v1/images/build", json={"name": name, "dockerfile": dockerfile, "base_image": base_image})
        r.raise_for_status()
        return r.json()

    def get_image(self, image_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/images/{image_id}")
        r.raise_for_status()
        return r.json()

    def delete_image(self, image_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/images/{image_id}")
        r.raise_for_status()
        return r.json()

    # -- dashboard ------------------------------------------------------------

    def dashboard(self, workspace_id: str, environment_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/dashboard/{workspace_id}/{environment_id}")
        r.raise_for_status()
        return r.json()

    def dashboard_summary(self, workspace_id: str, environment_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/dashboard/{workspace_id}/{environment_id}/summary")
        r.raise_for_status()
        return r.json()

    # -- billing --------------------------------------------------------------

    def balance(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/billing/balance?user_id={user_id}")
        r.raise_for_status()
        return r.json()

    def billing_balance(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/billing/balance?user_id={user_id}")
        r.raise_for_status()
        return r.json()

    def billing_usage(self, user_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/billing/usage?user_id={user_id}")
        r.raise_for_status()
        return r.json()

    def add_credits(self, user_id: str, amount_usd: float) -> dict[str, Any]:
        r = self._http.post("/v1/billing/credits", json={"user_id": user_id, "amount_usd": amount_usd})
        r.raise_for_status()
        return r.json()

    def create_checkout(self, user_id: str, amount_usd: float, success_url: str | None = None, cancel_url: str | None = None) -> dict[str, Any]:
        payload = {"user_id": user_id, "amount_usd": amount_usd}
        if success_url is not None:
            payload["success_url"] = success_url
        if cancel_url is not None:
            payload["cancel_url"] = cancel_url
        r = self._http.post("/v1/billing/checkout", json=payload)
        r.raise_for_status()
        return r.json()

    def get_billing_history(self, user_id: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/v1/billing/history?user_id={user_id}")
        r.raise_for_status()
        return r.json()

    def get_invoices(self, user_id: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/v1/billing/invoices?user_id={user_id}")
        r.raise_for_status()
        return r.json()

    # -- usage ----------------------------------------------------------------

    def list_usage(self, workload_id: str | None = None, owner_id: str | None = None) -> list[dict[str, Any]]:
        params = {}
        if workload_id is not None:
            params["workload_id"] = workload_id
        if owner_id is not None:
            params["owner_id"] = owner_id
        r = self._http.get("/v1/usage", params=params)
        r.raise_for_status()
        return r.json()

    def meter_usage(
        self,
        workload_id: str,
        cpu_seconds: float = 0,
        ram_gb_seconds: float = 0,
        gpu_seconds: float = 0,
        storage_gb_seconds: float = 0,
        egress_gb: float = 0,
    ) -> dict[str, Any]:
        r = self._http.post(
            "/v1/usage/meter",
            json={
                "workload_id": workload_id,
                "cpu_seconds": cpu_seconds,
                "ram_gb_seconds": ram_gb_seconds,
                "gpu_seconds": gpu_seconds,
                "storage_gb_seconds": storage_gb_seconds,
                "egress_gb": egress_gb,
            },
        )
        r.raise_for_status()
        return r.json()

    # -- invites --------------------------------------------------------------

    def list_invites(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        r = self._http.get("/v1/invites", params=params)
        r.raise_for_status()
        return r.json()

    def create_invite(self, workspace_id: str, email: str, role: str = "viewer") -> dict[str, Any]:
        r = self._http.post("/v1/invites", json={"workspace_id": workspace_id, "email": email, "role": role})
        r.raise_for_status()
        return r.json()

    def accept_invite(self, token: str) -> dict[str, Any]:
        r = self._http.post("/v1/invites/accept", json={"token": token})
        r.raise_for_status()
        return r.json()

    def get_invite(self, invite_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/invites/{invite_id}")
        r.raise_for_status()
        return r.json()

    def delete_invite(self, invite_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/invites/{invite_id}")
        r.raise_for_status()
        return r.json()

    # -- providers ------------------------------------------------------------

    def list_providers(self) -> list[dict[str, Any]]:
        r = self._http.get("/v1/providers")
        r.raise_for_status()
        return r.json()

    def get_provider(self, provider_id: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/providers/{provider_id}")
        r.raise_for_status()
        return r.json()

    def register_provider(self, name: str, region: str, pool: str, total_slots: int) -> dict[str, Any]:
        r = self._http.post("/v1/providers/register", json={"name": name, "region": region, "pool": pool, "total_slots": total_slots})
        r.raise_for_status()
        return r.json()

    def delete_provider(self, provider_id: str) -> dict[str, Any]:
        r = self._http.delete(f"/v1/providers/{provider_id}")
        r.raise_for_status()
        return r.json()

    def provider_heartbeat(self, provider_id: str, available_slots: int = 0, running_workloads: int = 0, status: str = "online") -> dict[str, Any]:
        r = self._http.post(f"/v1/providers/{provider_id}/heartbeat", json={"available_slots": available_slots, "running_workloads": running_workloads, "status": status})
        r.raise_for_status()
        return r.json()

    def claim_next_assignment(self, provider_id: str) -> dict[str, Any] | None:
        r = self._http.post(f"/v1/providers/{provider_id}/assignments/next")
        r.raise_for_status()
        return r.json()

    # -- sandbox sessions ----------------------------------------------------

    def create_sandbox_session(self, workload_id: str, requester_id: str, ttl_seconds: int = 900) -> dict[str, Any]:
        r = self._http.post("/v1/sandbox-sessions", json={"workload_id": workload_id, "requester_id": requester_id, "ttl_seconds": ttl_seconds})
        r.raise_for_status()
        return r.json()

    def verify_sandbox_session(self, token: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/sandbox-sessions/verify?token={token}")
        r.raise_for_status()
        return r.json()

    # -- runpod ---------------------------------------------------------------

    def dispatch_runpod(self, workload_id: str, template: str, gpu_type: str | None = None, gpu_count: int = 0, env: dict[str, str] | None = None) -> dict[str, Any]:
        payload = {
            "workload_id": workload_id,
            "template": template,
            "gpu_type": gpu_type,
            "gpu_count": gpu_count,
            "env": env or {},
        }
        r = self._http.post("/v1/runpod/dispatch", json=payload)
        r.raise_for_status()
        return r.json()

    # -- pricing --------------------------------------------------------------

    def pricing(self) -> dict[str, Any]:
        r = self._http.get("/v1/pricing")
        r.raise_for_status()
        return r.json()
