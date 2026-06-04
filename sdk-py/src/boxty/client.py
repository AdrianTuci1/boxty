from __future__ import annotations
import httpx
from typing import Any, List, Optional
from .sandbox import Sandbox
from .image import Image
from .app import App
from .secret import Secret
from .schedule import Schedule
from .volume import Volume
from .workspace import Workspace
from .environment import Environment
from .exceptions import BoxtyAPIError

class Client:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.boxty.dev"):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.headers = {}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        self._client = httpx.Client(base_url=self.base_url, headers=self.headers, timeout=30.0)

    def _request(self, method: str, path: str, **kwargs) -> Any:
        resp = self._client.request(method, path, **kwargs)
        if resp.status_code >= 400:
            raise BoxtyAPIError(resp.text, resp.status_code)
        return resp.json()

    # Workspaces
    def create_workspace(self, name: str, description: str = "") -> Workspace:
        data = self._request("POST", "/api/workspaces", json={"name": name, "description": description})
        return Workspace(self, data)

    def list_workspaces(self) -> List[Workspace]:
        data = self._request("GET", "/api/workspaces")
        return [Workspace(self, d) for d in data]

    def get_workspace(self, id: str) -> Workspace:
        data = self._request("GET", f"/api/workspaces/{id}")
        return Workspace(self, data)

    def delete_workspace(self, id: str) -> None:
        self._request("DELETE", f"/api/workspaces/{id}")

    # Environments
    def create_environment(self, workspace_id: str, name: str, type: str = "development") -> Environment:
        data = self._request("POST", "/api/environments", json={"workspace_id": workspace_id, "name": name, "type": type})
        return Environment(self, data)

    def list_environments(self, workspace_id: str) -> List[Environment]:
        data = self._request("GET", "/api/environments")
        return [Environment(self, d) for d in data]

    # Apps
    def create_app(self, workspace_id: str, env_id: str, name: str, image: str, cpu: int, memory: int, gpu: Optional[str] = None, timeout: int = 3600) -> App:
        data = self._request("POST", "/api/apps", json={"workspace_id": workspace_id, "env_id": env_id, "name": name, "image": image, "cpu": cpu, "memory": memory, "gpu": gpu, "timeout": timeout})
        return App(self, data)

    def list_apps(self) -> List[App]:
        data = self._request("GET", "/api/apps")
        return [App(self, d) for d in data]

    def get_app(self, id: str) -> App:
        data = self._request("GET", f"/api/apps/{id}")
        return App(self, data)

    def delete_app(self, id: str) -> None:
        self._request("DELETE", f"/api/apps/{id}")

    def stop_app(self, id: str) -> None:
        self._request("POST", f"/api/apps/{id}/stop")

    def deploy_app(self, id: str, image: Optional[str] = None, cpu: Optional[int] = None, memory: Optional[int] = None, gpu: Optional[str] = None) -> Any:
        return self._request("POST", f"/api/apps/{id}/deploy", json={"image": image, "cpu": cpu, "memory": memory, "gpu": gpu})

    def get_app_sandboxes(self, id: str) -> List[Sandbox]:
        data = self._request("GET", f"/api/apps/{id}/sandboxes")
        return [Sandbox(self, d) for d in data]

    def get_app_deployments(self, id: str) -> List[Any]:
        return self._request("GET", f"/api/apps/{id}/deployments")

    def get_app_metrics(self, id: str) -> Any:
        return self._request("GET", f"/api/apps/{id}/metrics")

    def get_app_usage(self, id: str) -> Any:
        return self._request("GET", f"/api/apps/{id}/usage")

    def get_app_logs(self, id: str) -> List[str]:
        return self._request("GET", f"/api/apps/{id}/logs")

    # Sandboxes
    def create_sandbox(self, image: str, cpu: int = 1, memory: int = 1024, gpu: Optional[str] = None, timeout: int = 3600, disk_size_gb: int = 10, volume: Optional[str] = None, volume_mount_path: Optional[str] = None, app_id: Optional[str] = None, env_id: Optional[str] = None) -> Sandbox:
        data = self._request("POST", "/api/sandboxes", json={"image": image, "cpu": cpu, "memory": memory, "gpu": gpu, "timeout": timeout, "disk_size_gb": disk_size_gb, "volume": volume, "volume_mount_path": volume_mount_path, "app_id": app_id, "env_id": env_id})
        return Sandbox(self, data)

    def list_sandboxes(self) -> List[Sandbox]:
        data = self._request("GET", "/api/sandboxes")
        return [Sandbox(self, d) for d in data]

    def get_sandbox(self, id: str) -> Sandbox:
        data = self._request("GET", f"/api/sandboxes/{id}")
        return Sandbox(self, data)

    def delete_sandbox(self, id: str) -> None:
        self._request("DELETE", f"/api/sandboxes/{id}")

    def get_sandbox_metrics(self, id: str) -> Any:
        return self._request("GET", f"/api/sandboxes/{id}/metrics")

    # Billing
    def balance(self) -> int:
        data = self._request("GET", "/api/billing/balance")
        return data.get("balance", 0)

    def usage(self) -> Any:
        return self._request("GET", "/api/billing/usage")

    def buy_credits(self, amount: int) -> Any:
        return self._request("POST", "/api/billing/credits", json={"amount": amount})

    # Images
    def build_image(self, name: str, base_image: str, commands: List[str], files: Optional[dict] = None) -> Any:
        return self._request("POST", "/api/images/build", json={"name": name, "base_image": base_image, "commands": commands, "files": files})

    def list_images(self) -> List[Any]:
        return self._request("GET", "/api/images")

    def delete_image(self, id: str) -> None:
        self._request("DELETE", f"/api/images/{id}")

    # Secrets
    def create_secret(self, name: str, value: str) -> Secret:
        data = self._request("POST", "/api/secrets", json={"name": name, "value": value})
        return Secret(self, data)

    def list_secrets(self) -> List[Secret]:
        data = self._request("GET", "/api/secrets")
        return [Secret(self, d) for d in data]

    def delete_secret(self, name: str) -> None:
        self._request("DELETE", f"/api/secrets/{name}")

    def attach_secrets(self, sandbox_id: str, secret_names: List[str]) -> Any:
        return self._request("POST", f"/api/secrets/attach/{sandbox_id}", json={"secret_names": secret_names})

    # Schedules
    def create_schedule(self, name: str, schedule_type: str, schedule_value: str, function_name: str, args: dict, image: str, cpu: int, memory: int, gpu: Optional[str] = None, timeout: int = 3600, secrets: Optional[List[str]] = None) -> Schedule:
        data = self._request("POST", "/api/schedules", json={"name": name, "schedule_type": schedule_type, "schedule_value": schedule_value, "function_name": function_name, "args": args, "image": image, "cpu": cpu, "memory": memory, "gpu": gpu, "timeout": timeout, "secrets": secrets})
        return Schedule(self, data)

    def list_schedules(self) -> List[Schedule]:
        data = self._request("GET", "/api/schedules")
        return [Schedule(self, d) for d in data]

    def delete_schedule(self, id: str) -> None:
        self._request("DELETE", f"/api/schedules/{id}")

    def trigger_schedule(self, id: str) -> None:
        self._request("POST", f"/api/schedules/{id}/trigger")

    # Volumes
    def create_volume(self, name: str, size_gb: int = 50) -> Volume:
        data = self._request("POST", "/api/volumes", json={"name": name, "size_gb": size_gb})
        return Volume(self, data)

    def list_volumes(self) -> List[Volume]:
        data = self._request("GET", "/api/volumes")
        return [Volume(self, d) for d in data]

    def delete_volume(self, id: str) -> None:
        self._request("DELETE", f"/api/volumes/{id}")

    def mount_volume(self, volume_id: str, sandbox_id: str, mount_path: str) -> Any:
        return self._request("POST", f"/api/volumes/{volume_id}/mount", json={"sandbox_id": sandbox_id, "mount_path": mount_path})

    def unmount_volume(self, volume_id: str, sandbox_id: str) -> Any:
        return self._request("POST", f"/api/volumes/{volume_id}/unmount", json={"sandbox_id": sandbox_id})
