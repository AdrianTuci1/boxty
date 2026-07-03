from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import httpx

from .manifest import ManifestBuilder
from .config import CliConfig


class BoxtyCliClient:
    """Thin CLI client that talks to the Boxty control plane."""

    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        self.base_url = (base_url or os.environ.get("BOXTY_CONTROL_PLANE_URL") or "http://127.0.0.1:8000").rstrip("/")
        self.token = token or os.environ.get("BOXTY_TOKEN")
        self._http = httpx.Client(base_url=self.base_url, timeout=30)

    def _headers(self) -> dict[str, str]:
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        r = self._http.post(path, json=payload, headers=self._headers())
        r.raise_for_status()
        return r.json()

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        r = self._http.get(path, params=params, headers=self._headers())
        r.raise_for_status()
        return r.json()

    def register_user(self, external_user_id: str, email: str | None = None) -> dict[str, Any]:
        return self._post("/v1/auth/register", {"external_user_id": external_user_id, "email": email})

    def create_workload(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("/v1/workloads", payload)

    def get_workload(self, workload_id: str) -> dict[str, Any]:
        return self._get(f"/v1/workloads/{workload_id}")

    def list_workloads(self) -> list[dict[str, Any]]:
        return self._get("/v1/workloads")

    def create_sandbox_session(self, workload_id: str, requester_id: str, ttl_seconds: int = 900) -> dict[str, Any]:
        return self._post("/v1/sandbox-sessions", {"workload_id": workload_id, "requester_id": requester_id, "ttl_seconds": ttl_seconds})

    def publish_route(self, workload_id: str, hostname: str, path_prefix: str = "/") -> dict[str, Any]:
        return self._post("/v1/routes", {"workload_id": workload_id, "hostname": hostname, "path_prefix": path_prefix})


class AppRunner:
    """Runs/deploys a Boxty App declared in a Python module."""

    def __init__(self, app_path: str, client: BoxtyCliClient | None = None) -> None:
        self.app_path = Path(app_path).expanduser().resolve()
        self.client = client or BoxtyCliClient()
        self._manifest = ManifestBuilder(self.app_path)

    def _ensure_user(self) -> dict[str, Any]:
        """Return current user context (signup if none configured)."""
        if self.client.token:
            # In a real CLI we'd validate the token; here we assume it works.
            # Return a minimal context; workspace/env will be created if missing.
            return {"default_workspace_id": "", "default_environment_id": ""}
        local_id = f"boxty-local-{os.getpid()}"
        user = self.client.register_user(local_id, f"{local_id}@local.boxty")
        self.client.token = user["access_token"]
        os.environ["BOXTY_TOKEN"] = user["access_token"]
        return user

    def _wait_for_workload(self, workload_id: str, target_status: str, timeout: int = 60) -> dict[str, Any]:
        for _ in range(timeout):
            wl = self.client.get_workload(workload_id)
            status = wl.get("status")
            if status == target_status or status in {"completed", "failed"}:
                return wl
            time.sleep(1)
        raise RuntimeError(f"timed out waiting for workload {workload_id} to reach {target_status}")

    def _resolve_user_context(self) -> tuple[str, str, str]:
        user = self._ensure_user()
        user_id = user.get("user_id", "")
        workspace_id = user.get("default_workspace_id", "")
        environment_id = user.get("default_environment_id", "")
        if not workspace_id or not environment_id:
            # Auto-create workspace and environment if missing
            if not user_id:
                user = self._ensure_user()
                user_id = user["user_id"]
            workspace_id = self.client._post("/v1/workspaces", {"owner_id": user_id, "name": "default"})["workspace_id"]
            environment_id = self.client._post("/v1/environments", {"workspace_id": workspace_id, "name": "default"})["environment_id"]
        return user_id, workspace_id, environment_id

    def run_function(self, function_name: str | None = None) -> dict[str, Any]:
        """Run a single function workload."""
        user_id, workspace_id, environment_id = self._resolve_user_context()
        fn = self._manifest.get_function(function_name)
        payload = fn.to_workload_payload(user_id, workspace_id, environment_id, kind="function")
        workload = self.client.create_workload(payload)
        print(f"Created function workload {workload['workload_id']}")
        final = self._wait_for_workload(workload["workload_id"], "completed")
        print(f"Status: {final['status']}")
        details = final.get("runtime_details", {})
        if details.get("stdout"):
            print("--- stdout ---")
            print(details["stdout"])
        if details.get("stderr"):
            print("--- stderr ---")
            print(details["stderr"])
        return final

    def deploy_endpoint(self, endpoint_name: str | None = None, wait: bool = True) -> dict[str, Any]:
        """Deploy an endpoint workload and return its URL."""
        user_id, workspace_id, environment_id = self._resolve_user_context()
        ep = self._manifest.get_endpoint(endpoint_name)
        payload = ep.to_workload_payload(user_id, workspace_id, environment_id, kind="endpoint")
        workload = self.client.create_workload(payload)
        print(f"Created endpoint workload {workload['workload_id']}")
        if not wait:
            return workload
        final = self._wait_for_workload(workload["workload_id"], "running")
        print(f"Status: {final['status']}")
        runtime = final.get("runtime_details", {})
        origin_url = runtime.get("origin_url")
        if origin_url:
            print(f"Endpoint URL: {origin_url}")
            try:
                with httpx.Client(timeout=10) as c:
                    r = c.get(origin_url)
                    print(f"HTTP {r.status_code}: {r.text[:200]}")
            except Exception as exc:
                print(f"Could not reach endpoint: {exc}")
        return final

    def start_sandbox(self, command: list[str] | None = None) -> dict[str, Any]:
        """Start a sandbox workload and open an interactive shell."""
        user_id, workspace_id, environment_id = self._resolve_user_context()
        sandbox = self._manifest.get_sandbox()
        payload = sandbox.to_workload_payload(user_id, workspace_id, environment_id, kind="sandbox")
        if command:
            payload["command"] = command
        workload = self.client.create_workload(payload)
        print(f"Created sandbox workload {workload['workload_id']}")
        final = self._wait_for_workload(workload["workload_id"], "running")
        print(f"Status: {final['status']}")
        if final['status'] == 'failed':
            runtime = final.get("runtime_details", {})
            if runtime.get("stderr"):
                print("--- stderr ---")
                print(runtime["stderr"])
            raise RuntimeError(f"sandbox {workload['workload_id']} failed")
        runtime = final.get("runtime_details", {})
        attach_cmd = runtime.get("attach_command")
        if attach_cmd:
            print(f"Sandbox attach command: {attach_cmd}")
        print(f"Sandbox is running.")
        return final
