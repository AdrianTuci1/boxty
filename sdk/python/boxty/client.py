from __future__ import annotations

import os
from typing import Any

import httpx

from .secrets import SecretsClient
from .volumes import VolumesClient
from .databases import DatabasesClient
from .exceptions import BoxtyAPIError, BoxtyConnectionError


class Boxty:
    """Root client for the Boxty platform SDK.

    Auto-discovers the gateway URL from the ``BOXTY_GATEWAY_URL``
    environment variable (set automatically by ``boxty deploy`` /
    ``boxty run``).  Falls back to ``http://127.0.0.1:8080`` for local
    development.
    """

    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        self._base = (base_url or os.environ.get("BOXTY_GATEWAY_URL") or "http://127.0.0.1:8080").rstrip("/")
        self._token = token or os.environ.get("BOXTY_TOKEN")
        headers = {}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        self._http = httpx.Client(base_url=self._base, timeout=30, headers=headers)

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

    # -- internal helpers -----------------------------------------------------

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        """Execute an HTTP request and map errors to Boxty exceptions."""
        try:
            r = getattr(self._http, method)(path, **kwargs)
            r.raise_for_status()
            return r.json() if r.content else {}
        except httpx.HTTPStatusError as exc:
            detail = ""
            try:
                detail = exc.response.json().get("detail", exc.response.text)
            except Exception:
                detail = exc.response.text or str(exc)
            raise BoxtyAPIError(detail, status_code=exc.response.status_code) from exc
        except httpx.ConnectError as exc:
            raise BoxtyConnectionError(str(exc)) from exc

    def _default_user_id(self) -> str:
        return os.environ.get("BOXTY_USER_ID", "")

    # -- app state ------------------------------------------------------------

    def state(self) -> dict[str, Any]:
        return self._request("get", "/api/cli/state")

    # -- auth -----------------------------------------------------------------

    def login(self, external_user_id: str, email: str | None = None) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/auth/login",
            json={"external_user_id": external_user_id, "email": email},
        )

    def device_code(self) -> dict[str, Any]:
        return self._request("post", "/v1/auth/device", json={})

    def device_token(self, device_code: str) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/auth/device/token",
            json={"device_code": device_code},
        )

    def signup(self, external_user_id: str, email: str | None = None, organization_id: str | None = None) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/auth/register",
            json={
                "external_user_id": external_user_id,
                "email": email,
                "organization_id": organization_id,
            },
        )

    def whoami(self, token: str | None = None) -> dict[str, Any]:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return self._request("get", "/v1/auth/me", headers=headers)

    # -- workspaces -----------------------------------------------------------

    def workspaces(self, owner_id: str | None = None) -> list[dict[str, Any]]:
        params = {"owner_id": owner_id} if owner_id else None
        return self._request("get", "/v1/workspaces", params=params)

    def create_workspace(self, name: str | dict[str, Any], owner_id: str | None = None) -> dict[str, Any]:
        """Create a workspace.

        Supports both the documented ``client.create_workspace("name")`` form
        and the low-level ``client.create_workspace({"owner_id": ..., "name": ...})`` form.
        """
        if isinstance(name, dict):
            payload = name
        else:
            payload = {"owner_id": owner_id or self._default_user_id(), "name": name}
        return self._request("post", "/v1/workspaces", json=payload)

    def get_workspace(self, workspace_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/workspaces/{workspace_id}")

    def update_workspace(self, workspace_id: str, **updates: Any) -> dict[str, Any]:
        return self._request("patch", f"/v1/workspaces/{workspace_id}", json=updates)

    def delete_workspace(self, workspace_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/workspaces/{workspace_id}")

    # -- environments ---------------------------------------------------------

    def environments(self, workspace_id: str) -> list[dict[str, Any]]:
        return self._request("get", f"/v1/workspaces/{workspace_id}/environments")

    def create_environment(self, workspace_id: str, name: str) -> dict[str, Any]:
        return self._request("post", "/v1/environments", json={"workspace_id": workspace_id, "name": name})

    def get_environment(self, environment_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/environments/{environment_id}")

    def update_environment(self, environment_id: str, **updates: Any) -> dict[str, Any]:
        return self._request("patch", f"/v1/environments/{environment_id}", json=updates)

    def delete_environment(self, environment_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/environments/{environment_id}")

    # -- api keys -------------------------------------------------------------

    def api_keys(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        return self._request("get", "/v1/api-keys", params=params)

    def create_api_key(self, owner_id: str, workspace_id: str, environment_id: str, name: str) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/api-keys",
            json={
                "owner_id": owner_id,
                "workspace_id": workspace_id,
                "environment_id": environment_id,
                "name": name,
            },
        )

    def get_api_key(self, api_key_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/api-keys/{api_key_id}")

    def update_api_key(self, api_key_id: str, **updates: Any) -> dict[str, Any]:
        return self._request("patch", f"/v1/api-keys/{api_key_id}", json=updates)

    def delete_api_key(self, api_key_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/api-keys/{api_key_id}")

    # -- pricing / billing ----------------------------------------------------

    def pricing(self) -> dict[str, Any]:
        return self._request("get", "/v1/pricing")

    def balance(self, user_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/accounts/{user_id}")

    def billing_balance(self, user_id: str) -> dict[str, Any]:
        return self._request("get", "/v1/billing/balance", params={"user_id": user_id})

    def billing_usage(self, user_id: str) -> dict[str, Any]:
        return self._request("get", "/v1/billing/usage", params={"user_id": user_id})

    def add_credits(self, user_id: str, amount_usd: float) -> dict[str, Any]:
        return self._request("post", "/v1/billing/credits", json={"user_id": user_id, "amount_usd": amount_usd})

    def create_checkout(self, user_id: str, amount_usd: float, **kwargs: Any) -> dict[str, Any]:
        payload = {"user_id": user_id, "amount_usd": amount_usd}
        payload.update(kwargs)
        return self._request("post", "/v1/billing/checkout", json=payload)

    def get_billing_history(self, user_id: str) -> list[dict[str, Any]]:
        return self._request("get", "/v1/billing/history", params={"user_id": user_id})

    def get_invoices(self, user_id: str) -> list[dict[str, Any]]:
        return self._request("get", "/v1/billing/invoices", params={"user_id": user_id})

    # -- workloads ------------------------------------------------------------

    def create_workload(
        self,
        owner_id: str,
        workspace_id: str,
        environment_id: str,
        kind: str,
        image: str,
        *,
        command: list[str] | None = None,
        env: dict[str, str] | None = None,
        region: str | None = None,
        pool: str | None = None,
        endpoint_name: str | None = None,
        requested_backend: str | None = None,
        allow_runpod_fallback: bool = True,
        secret_names: list[str] | None = None,
        volume_mounts: list[dict[str, Any]] | None = None,
        metadata: dict[str, Any] | None = None,
        cpu_cores: int = 1,
        memory_mb: int = 512,
        disk_gb: int = 2,
        gpu_count: int = 0,
        gpu_type: str | None = None,
        image_ref: str | None = None,
    ) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/workloads",
            json={
                "owner_id": owner_id,
                "workspace_id": workspace_id,
                "environment_id": environment_id,
                "kind": kind,
                "image": image,
                "command": command or [],
                "env": env or {},
                "region": region,
                "pool": pool,
                "endpoint_name": endpoint_name,
                "requested_backend": requested_backend,
                "allow_runpod_fallback": allow_runpod_fallback,
                "secret_names": secret_names or [],
                "volume_mounts": volume_mounts or [],
                "metadata": metadata or {},
                "resources": {
                    "cpu_cores": cpu_cores,
                    "memory_mb": memory_mb,
                    "disk_gb": disk_gb,
                    "gpu_count": gpu_count,
                    "gpu_type": gpu_type,
                },
                "image_ref": image_ref,
            },
        )

    def list_workloads(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if workspace_id:
            params["workspace_id"] = workspace_id
        if environment_id:
            params["environment_id"] = environment_id
        return self._request("get", "/v1/workloads", params=params or None)

    def get_workload(self, workload_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/workloads/{workload_id}")

    def update_workload(self, workload_id: str, **updates: Any) -> dict[str, Any]:
        return self._request("patch", f"/v1/workloads/{workload_id}", json=updates)

    def update_workload_status(self, workload_id: str, status: str) -> dict[str, Any]:
        return self._request("post", f"/v1/workloads/{workload_id}/status", json={"status": status})

    def delete_workload(self, workload_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/workloads/{workload_id}")

    def get_workload_metrics(self, workload_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/workloads/{workload_id}/metrics")

    def get_workload_logs(self, workload_id: str) -> list[dict[str, Any]]:
        return self._request("get", f"/v1/workloads/{workload_id}/logs")

    def get_workload_launch_spec(self, workload_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/workloads/{workload_id}/launch-spec")

    def invoke_workload(self, workload_id: str, payload: Any | None = None) -> dict[str, Any]:
        return self._request(
            "post",
            f"/v1/workloads/{workload_id}/invoke",
            json={"payload": payload},
        )

    def create_sandbox(self, image: str = "python:3.11", cpu: int = 1, memory: int = 512, timeout: int = 3600, **kwargs) -> dict[str, Any]:
        """Create a sandbox workload.

        Convenience wrapper around ``create_workload`` that mirrors the
        documented quickstart API.
        """
        owner_id = kwargs.get("owner_id") or self._default_user_id()
        workspace_id = kwargs.get("workspace_id") or os.environ.get("BOXTY_WORKSPACE_ID")
        environment_id = kwargs.get("environment_id") or os.environ.get("BOXTY_ENVIRONMENT_ID")
        if not owner_id or not workspace_id or not environment_id:
            raise ValueError("owner_id, workspace_id, environment_id required for create_sandbox")
        return self.create_workload(
            owner_id=owner_id,
            workspace_id=workspace_id,
            environment_id=environment_id,
            kind="sandbox",
            image=image,
            cpu_cores=cpu,
            memory_mb=memory,
        )

    # -- routes ---------------------------------------------------------------

    def list_routes(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if workspace_id:
            params["workspace_id"] = workspace_id
        if environment_id:
            params["environment_id"] = environment_id
        return self._request("get", "/v1/routes", params=params or None)

    def create_route(self, workload_id: str, endpoint_name: str, hostname: str | None = None, path_prefix: str = "/") -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/routes",
            json={
                "workload_id": workload_id,
                "endpoint_name": endpoint_name,
                "hostname": hostname,
                "path_prefix": path_prefix,
            },
        )

    def get_route(self, route_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/routes/{route_id}")

    def delete_route(self, route_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/routes/{route_id}")

    # -- schedules ------------------------------------------------------------

    def list_schedules(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if workspace_id:
            params["workspace_id"] = workspace_id
        if environment_id:
            params["environment_id"] = environment_id
        return self._request("get", "/v1/schedules", params=params or None)

    def create_schedule(
        self,
        name: str,
        schedule_type: str,
        cron: str,
        function_name: str,
        workspace_id: str,
        environment_id: str,
    ) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/schedules",
            json={
                "name": name,
                "type": schedule_type,
                "cron": cron,
                "function_name": function_name,
                "workspace_id": workspace_id,
                "environment_id": environment_id,
            },
        )

    def get_schedule(self, schedule_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/schedules/{schedule_id}")

    def update_schedule(self, schedule_id: str, **updates: Any) -> dict[str, Any]:
        return self._request("patch", f"/v1/schedules/{schedule_id}", json=updates)

    def delete_schedule(self, schedule_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/schedules/{schedule_id}")

    def trigger_schedule(self, schedule_id: str) -> dict[str, Any]:
        return self._request("post", f"/v1/schedules/{schedule_id}/trigger")

    # -- images ---------------------------------------------------------------

    def list_images(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        return self._request("get", "/v1/images", params=params)

    def build_image(
        self,
        name: str,
        dockerfile: str | None = None,
        base_image: str | None = None,
        workspace_id: str | None = None,
        owner_id: str | None = None,
        source_file_content: str | None = None,
        source_filename: str | None = None,
        extra_files: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"name": name}
        if dockerfile:
            payload["dockerfile"] = dockerfile
        if base_image:
            payload["base_image"] = base_image
        if workspace_id:
            payload["workspace_id"] = workspace_id
        if owner_id:
            payload["owner_id"] = owner_id
        if source_file_content:
            payload["source_file_content"] = source_file_content
        if source_filename:
            payload["source_filename"] = source_filename
        if extra_files:
            payload["extra_files"] = extra_files
        return self._request("post", "/v1/images/build", json=payload)

    def get_image(self, image_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/images/{image_id}")

    def get_image_build_status(self, image_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/images/{image_id}/build-status")

    def delete_image(self, image_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/images/{image_id}")

    # -- invites --------------------------------------------------------------

    def list_invites(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        return self._request("get", "/v1/invites", params=params)

    def create_invite(self, workspace_id: str, email: str, role: str = "developer") -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/invites",
            json={"workspace_id": workspace_id, "email": email, "role": role},
        )

    def get_invite(self, invite_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/invites/{invite_id}")

    def accept_invite(self, token: str, email: str | None = None, password: str | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"token": token}
        if email:
            payload["email"] = email
        if password:
            payload["password"] = password
        return self._request("post", "/v1/invites/accept", json=payload)

    def delete_invite(self, invite_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/invites/{invite_id}")

    # -- providers ------------------------------------------------------------

    def list_providers(self) -> list[dict[str, Any]]:
        return self._request("get", "/v1/providers")

    def get_provider(self, provider_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/providers/{provider_id}")

    def register_provider(
        self,
        name: str,
        region: str,
        tier: str,
        available_slots: int,
        **kwargs: Any,
    ) -> dict[str, Any]:
        payload = {
            "name": name,
            "region": region,
            "tier": tier,
            "available_slots": available_slots,
        }
        payload.update(kwargs)
        return self._request("post", "/v1/providers/register", json=payload)

    def delete_provider(self, provider_id: str) -> dict[str, Any]:
        return self._request("delete", f"/v1/providers/{provider_id}")

    def provider_heartbeat(self, provider_id: str, available_slots: int, assigned_workloads: int, status: str) -> dict[str, Any]:
        return self._request(
            "post",
            f"/v1/providers/{provider_id}/heartbeat",
            json={
                "available_slots": available_slots,
                "assigned_workloads": assigned_workloads,
                "status": status,
            },
        )

    def claim_next_assignment(self, provider_id: str) -> dict[str, Any] | None:
        return self._request("post", f"/v1/providers/{provider_id}/assignments/next")

    # -- sandbox sessions -----------------------------------------------------

    def create_sandbox_session(self, workload_id: str, requester_id: str, ttl_seconds: int = 900) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/sandbox-sessions",
            json={
                "workload_id": workload_id,
                "requester_id": requester_id,
                "ttl_seconds": ttl_seconds,
            },
        )

    def verify_sandbox_session(self, token: str) -> dict[str, Any]:
        return self._request("get", "/v1/sandbox-sessions/verify", params={"token": token})

    # -- runpod ---------------------------------------------------------------

    def dispatch_runpod(
        self,
        workload_id: str,
        template_id: str,
        gpu_type: str,
        gpu_count: int = 1,
    ) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/runpod/dispatch",
            json={
                "workload_id": workload_id,
                "template_id": template_id,
                "gpu_type": gpu_type,
                "gpu_count": gpu_count,
            },
        )

    # -- usage ----------------------------------------------------------------

    def list_usage(self, workload_id: str | None = None, owner_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if workload_id:
            params["workload_id"] = workload_id
        if owner_id:
            params["owner_id"] = owner_id
        return self._request("get", "/v1/usage", params=params or None)

    def meter_usage(
        self,
        workload_id: str,
        *,
        cpu_seconds: float = 0.0,
        ram_gb_seconds: float = 0.0,
        gpu_seconds: float = 0.0,
        storage_gb_seconds: float = 0.0,
    ) -> dict[str, Any]:
        return self._request(
            "post",
            "/v1/usage/meter",
            json={
                "workload_id": workload_id,
                "cpu_seconds": cpu_seconds,
                "ram_gb_seconds": ram_gb_seconds,
                "gpu_seconds": gpu_seconds,
                "storage_gb_seconds": storage_gb_seconds,
            },
        )

    # -- dashboard ------------------------------------------------------------

    def dashboard(self, workspace_id: str, environment_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/dashboard/{workspace_id}/{environment_id}")

    def dashboard_summary(self, workspace_id: str, environment_id: str) -> dict[str, Any]:
        return self._request("get", f"/v1/dashboard/{workspace_id}/{environment_id}/summary")
