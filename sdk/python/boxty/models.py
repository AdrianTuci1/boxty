from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class Workspace:
    """Represents a Boxty workspace."""

    _client: Any = field(repr=False)
    id: str
    name: str
    owner_id: str

    @classmethod
    def from_context(cls, client: Any) -> Workspace:
        """Get the current workspace from context."""
        raise NotImplementedError("Workspace.from_context() requires runtime context")

    def members(self) -> list[dict[str, Any]]:
        """List workspace members."""
        return self._client.list_invites(workspace_id=self.id)

    def billing_report(self) -> dict[str, Any]:
        """Get billing report for this workspace."""
        return self._client.billing_report(workspace_id=self.id)

    def proxy_tokens(self) -> ProxyTokenManager:
        """Manage proxy tokens for this workspace."""
        return ProxyTokenManager(self._client, self.id)

    def delete(self) -> dict[str, Any]:
        """Delete this workspace."""
        return self._client.delete_workspace(self.id)

    def __repr__(self) -> str:
        return f"Workspace(id={self.id}, name={self.name})"

    def __str__(self) -> str:
        return self.name


@dataclass
class ProxyTokenManager:
    """Manages proxy tokens for a workspace."""

    _client: Any = field(repr=False)
    _workspace_id: str = field(repr=False)

    def create(self, name: str, allowed_providers: list[str] | None = None, ttl_seconds: int | None = None) -> dict[str, Any]:
        return self._client.create_proxy_token(self._workspace_id, name, allowed_providers, ttl_seconds)

    def list(self) -> list[dict[str, Any]]:
        return self._client.list_proxy_tokens(self._workspace_id)

    def allow(self, token_id: str) -> dict[str, Any]:
        return self._client.update_proxy_token(token_id, status="active")

    def revoke(self, token_id: str) -> dict[str, Any]:
        return self._client.update_proxy_token(token_id, status="revoked")

    def delete(self, token_id: str) -> dict[str, Any]:
        return self._client.delete_proxy_token(token_id)


@dataclass
class Environment:
    """Represents a Boxty environment."""

    _client: Any = field(repr=False)
    id: str
    name: str
    workspace_id: str

    @classmethod
    def from_context(cls, client: Any) -> Environment:
        """Get the current environment from context."""
        raise NotImplementedError("Environment.from_context() requires runtime context")

    @classmethod
    def from_name(cls, client: Any, workspace_id: str, name: str) -> Environment:
        """Get environment by name."""
        envs = client.environments(workspace_id)
        for env in envs:
            if env.get("name") == name:
                return cls(client, env["id"], env["name"], workspace_id)
        raise ValueError(f"Environment '{name}' not found in workspace {workspace_id}")

    def objects(self) -> ObjectManager:
        """Manage objects in this environment."""
        return ObjectManager(self._client, self.id)

    def members(self) -> list[dict[str, Any]]:
        """List environment members (RBAC)."""
        return self._client.list_environment_members(self.id)

    def billing_report(self) -> dict[str, Any]:
        """Get billing report for this environment."""
        return self._client.billing_report(environment_id=self.id)

    def delete(self) -> dict[str, Any]:
        """Delete this environment."""
        return self._client.delete_environment(self.id)

    def __repr__(self) -> str:
        return f"Environment(id={self.id}, name={self.name})"


@dataclass
class ObjectManager:
    """Manages objects (files) in an environment."""

    _client: Any = field(repr=False)
    _environment_id: str = field(repr=False)

    def create(self, key: str, data: bytes) -> dict[str, Any]:
        raise NotImplementedError("Environment objects not yet implemented in backend")

    def list(self, prefix: str = "") -> list[dict[str, Any]]:
        raise NotImplementedError("Environment objects not yet implemented in backend")

    def delete(self, key: str) -> dict[str, Any]:
        raise NotImplementedError("Environment objects not yet implemented in backend")


@dataclass
class Secret:
    """Represents a Boxty secret."""

    _client: Any = field(repr=False)
    id: str
    name: str
    value: str

    @classmethod
    def from_name(cls, client: Any, name: str) -> Secret:
        """Get a secret by name."""
        secrets = client.secrets.list()
        for s in secrets:
            if s.get("name") == name:
                return cls(client, s["id"], s["name"], s.get("value", ""))
        raise ValueError(f"Secret '{name}' not found")

    @classmethod
    def from_dict(cls, client: Any, data: dict[str, str]) -> list[Secret]:
        """Create secrets from a dictionary."""
        secrets = []
        for name, value in data.items():
            s = client.secrets.create(name, value)
            secrets.append(cls(client, s["id"], s["name"], value))
        return secrets

    @classmethod
    def from_local_environ(cls, client: Any, prefix: str = "BOXTY_") -> list[Secret]:
        """Create secrets from local environment variables."""
        import os
        data = {k: v for k, v in os.environ.items() if k.startswith(prefix)}
        return cls.from_dict(client, data)

    @classmethod
    def from_dotenv(cls, client: Any, path: str = ".env") -> list[Secret]:
        """Create secrets from a .env file."""
        import os
        secrets = []
        if os.path.exists(path):
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        name, value = line.split("=", 1)
                        s = client.secrets.create(name.strip(), value.strip())
                        secrets.append(cls(client, s["id"], s["name"], value.strip()))
        return secrets

    def objects(self) -> ObjectManager:
        """Manage secret objects."""
        return ObjectManager(self._client, self.id)

    def update(self, value: str) -> dict[str, Any]:
        """Update the secret value."""
        return self._client.secrets.update(self.id, value)

    def info(self) -> dict[str, Any]:
        """Get secret info."""
        return self._client.secrets.get(self.id)

    def delete(self) -> dict[str, Any]:
        """Delete this secret."""
        return self._client.secrets.delete(self.id)

    def __repr__(self) -> str:
        return f"Secret(id={self.id}, name={self.name})"


@dataclass
class Image:
    """Represents a Boxty container image."""

    _client: Any = field(repr=False)
    id: str | None
    name: str
    dockerfile: str | None = None
    base_image: str | None = None

    @classmethod
    def debian_slim(cls, client: Any, python_version: str = "3.11") -> Image:
        """Create a Debian slim image."""
        return cls(client, None, f"debian-slim-python{python_version}", None, f"python:{python_version}-slim")

    @classmethod
    def from_registry(cls, client: Any, tag: str) -> Image:
        """Create an image from a registry tag."""
        return cls(client, None, tag, None, tag)

    @classmethod
    def from_id(cls, client: Any, image_id: str) -> Image:
        """Get an image by ID."""
        img = client.get_image(image_id)
        return cls(client, image_id, img.get("name", ""), None, img.get("base_image"))

    def build(self) -> dict[str, Any]:
        """Build the image."""
        return self._client.build_image(self.name, self.dockerfile, self.base_image)

    def pip_install(self, *packages: str) -> Image:
        """Install Python packages."""
        return self

    def uv_pip_install(self, *packages: str) -> Image:
        """Install Python packages with uv."""
        return self

    def pip_install_from_requirements(self, path: str) -> Image:
        """Install from requirements.txt."""
        return self

    def pip_install_from_pyproject(self, path: str) -> Image:
        """Install from pyproject.toml."""
        return self

    def poetry_install_from_file(self, path: str) -> Image:
        """Install from poetry.lock."""
        return self

    def uv_sync(self, path: str) -> Image:
        """Sync with uv."""
        return self

    def add_local_file(self, local_path: str, remote_path: str) -> Image:
        """Add a local file."""
        return self

    def add_local_dir(self, local_path: str, remote_path: str) -> Image:
        """Add a local directory."""
        return self

    def add_local_python_source(self, module_name: str, path: str) -> Image:
        """Add local Python source."""
        return self

    def __repr__(self) -> str:
        return f"Image(id={self.id}, name={self.name})"


@dataclass
class Sandbox:
    """Represents a Boxty sandbox session."""

    _client: Any = field(repr=False)
    id: str
    workload_id: str
    token: str | None = None

    @classmethod
    def create(cls, client: Any, workload_id: str, requester_id: str, ttl_seconds: int = 900) -> Sandbox:
        """Create a new sandbox session."""
        result = client.create_sandbox_session(workload_id, requester_id, ttl_seconds)
        return cls(client, result["id"], workload_id, result.get("token"))

    @classmethod
    def from_name(cls, client: Any, name: str) -> Sandbox:
        """Get a sandbox by name."""
        raise NotImplementedError("Sandbox.from_name() not yet implemented")

    @classmethod
    def from_id(cls, client: Any, sandbox_id: str) -> Sandbox:
        """Get a sandbox by ID."""
        raise NotImplementedError("Sandbox.from_id() not yet implemented")

    def wait(self, timeout: float = 60.0) -> Sandbox:
        """Wait for the sandbox to be ready."""
        import time
        start = time.time()
        while time.time() - start < timeout:
            workload = self._client.get_workload(self.workload_id)
            if workload.get("status") in ("running", "ready"):
                return self
            time.sleep(1.0)
        raise TimeoutError(f"Sandbox {self.id} did not become ready within {timeout}s")

    def wait_until_ready(self, timeout: float = 60.0) -> Sandbox:
        """Alias for wait()."""
        return self.wait(timeout)

    def terminate(self) -> dict[str, Any]:
        """Terminate the sandbox."""
        return self._client.delete_workload(self.workload_id)

    def poll(self) -> dict[str, Any]:
        """Poll sandbox status."""
        return self._client.get_workload(self.workload_id)

    def run_command(self, command: list[str], timeout_seconds: int = 60) -> dict[str, Any]:
        """Execute a command in the sandbox."""
        return self._client.sandbox_exec(self.id, command, timeout_seconds)

    def get_tunnels(self) -> list[dict[str, Any]]:
        """List active tunnels."""
        return self._client.list_sandbox_tunnels(self.id)

    def create_tunnel(self, port: int, protocol: str = "tcp") -> dict[str, Any]:
        """Create a tunnel."""
        return self._client.create_sandbox_tunnel(self.id, port, protocol)

    def create_connect_token(self) -> str:
        """Create a connect token."""
        raise NotImplementedError("Sandbox connect tokens not yet implemented")

    def snapshot_filesystem(self) -> dict[str, Any]:
        """Snapshot the entire filesystem."""
        raise NotImplementedError("Sandbox snapshots not yet implemented")

    def snapshot_directory(self, path: str) -> dict[str, Any]:
        """Snapshot a directory."""
        raise NotImplementedError("Sandbox snapshots not yet implemented")

    def mount_image(self, image_id: str, mount_point: str) -> dict[str, Any]:
        """Mount an image."""
        raise NotImplementedError("Sandbox image mounts not yet implemented")

    def unmount_image(self, mount_point: str) -> dict[str, Any]:
        """Unmount an image."""
        raise NotImplementedError("Sandbox image mounts not yet implemented")

    def filesystem(self) -> FileSystemManager:
        """Access the sandbox filesystem."""
        return FileSystemManager(self._client, self.id, self.workload_id)

    def __repr__(self) -> str:
        return f"Sandbox(id={self.id}, workload_id={self.workload_id})"


@dataclass
class FileSystemManager:
    """Manages filesystem operations in a sandbox."""

    _client: Any = field(repr=False)
    _sandbox_id: str = field(repr=False)
    _workload_id: str = field(repr=False)

    def copy_from_local(self, local_path: str, remote_path: str) -> dict[str, Any]:
        raise NotImplementedError("Filesystem copy not yet implemented")

    def copy_to_local(self, remote_path: str, local_path: str) -> dict[str, Any]:
        raise NotImplementedError("Filesystem copy not yet implemented")

    def list_files(self, path: str = "/") -> list[dict[str, Any]]:
        """List files in the sandbox."""
        return self._client.list_sandbox_files(self._sandbox_id, path)

    def copy_files(self, files: list[dict[str, Any]]) -> dict[str, Any]:
        """Copy files in the sandbox."""
        return self._client.copy_sandbox_files(self._sandbox_id, files)


@dataclass
class Function:
    """Represents a Boxty function."""

    _client: Any = field(repr=False)
    name: str
    _func: Callable | None = field(default=None, repr=False)

    @classmethod
    def from_name(cls, client: Any, name: str) -> Function:
        """Get a function by name."""
        return cls(client, name)

    def remote(self, *args: Any, **kwargs: Any) -> Any:
        """Call the function remotely."""
        raise NotImplementedError("Function.remote() requires runtime context")

    def remote_gen(self, *args: Any, **kwargs: Any) -> Any:
        """Call the function remotely and return a generator."""
        raise NotImplementedError("Function.remote_gen() requires runtime context")

    def local(self, *args: Any, **kwargs: Any) -> Any:
        """Call the function locally."""
        if not self._func:
            raise ValueError("No local function bound")
        return self._func(*args, **kwargs)

    def spawn(self, *args: Any, **kwargs: Any) -> Any:
        """Spawn the function asynchronously."""
        raise NotImplementedError("Function.spawn() requires runtime context")

    def map(self, inputs: list[Any]) -> list[Any]:
        """Map the function over inputs."""
        raise NotImplementedError("Function.map() requires runtime context")

    def starmap(self, inputs: list[tuple[Any, ...]]) -> list[Any]:
        """Starmap the function over inputs."""
        raise NotImplementedError("Function.starmap() requires runtime context")

    def for_each(self, inputs: list[Any]) -> None:
        """Apply the function to each input."""
        raise NotImplementedError("Function.for_each() requires runtime context")

    def spawn_map(self, inputs: list[Any]) -> list[Any]:
        """Spawn the function for each input."""
        raise NotImplementedError("Function.spawn_map() requires runtime context")

    def get_web_url(self) -> str:
        """Get the web URL for this function."""
        raise NotImplementedError("Function.get_web_url() not yet implemented")

    def with_options(self, **options: Any) -> Function:
        """Return a new function with updated options."""
        return self

    def with_concurrency(self, limit: int) -> Function:
        """Set concurrency limit."""
        return self

    def with_batching(self, max_size: int, wait_ms: int) -> Function:
        """Set batching options."""
        return self

    def update_autoscaler(self, min_containers: int = 0, max_containers: int = 10) -> dict[str, Any]:
        """Update autoscaler configuration."""
        return self._client.update_function_autoscaler(self.name, min_containers, max_containers)

    def get_current_stats(self) -> dict[str, Any]:
        """Get current function statistics."""
        return self._client.get_function_stats(self.name)

    def __repr__(self) -> str:
        return f"Function(name={self.name})"


@dataclass
class Volume:
    """Represents a Boxty volume."""

    _client: Any = field(repr=False)
    id: str
    name: str

    @classmethod
    def from_name(cls, client: Any, name: str) -> Volume:
        """Get a volume by name."""
        volumes = client.list_volumes()
        for v in volumes:
            if v.get("name") == name:
                return cls(client, v["id"], v["name"])
        raise ValueError(f"Volume '{name}' not found")

    @classmethod
    def from_id(cls, client: Any, volume_id: str) -> Volume:
        """Get a volume by ID."""
        v = client.get_volume(volume_id)
        return cls(client, volume_id, v.get("name", ""))

    @classmethod
    def ephemeral(cls, client: Any, name: str) -> Volume:
        """Create an ephemeral volume."""
        raise NotImplementedError("Ephemeral volumes not yet implemented")

    def objects(self) -> ObjectManager:
        """Manage volume objects."""
        return ObjectManager(self._client, self.id)

    def commit(self) -> dict[str, Any]:
        """Commit volume changes."""
        raise NotImplementedError("Volume commit not yet implemented")

    def reload(self) -> Volume:
        """Reload volume info."""
        v = self._client.get_volume(self.id)
        self.name = v.get("name", self.name)
        return self

    def listdir(self, path: str = "/") -> list[str]:
        """List directory contents."""
        entries = self._client.list_volume_entries(self.id, path)
        return [e.get("path", "") for e in entries]

    def read_file(self, path: str) -> bytes:
        """Read a file from the volume."""
        raise NotImplementedError("Volume read_file not yet implemented")

    def remove_file(self, path: str) -> dict[str, Any]:
        """Remove a file from the volume."""
        raise NotImplementedError("Volume remove_file not yet implemented")

    def copy_files(self, src: str, dst: str) -> dict[str, Any]:
        """Copy files in the volume."""
        raise NotImplementedError("Volume copy_files not yet implemented")

    def batch_upload(self, files: dict[str, bytes]) -> dict[str, Any]:
        """Batch upload files."""
        raise NotImplementedError("Volume batch_upload not yet implemented")

    def rename(self, new_name: str) -> dict[str, Any]:
        """Rename the volume."""
        return self._client.update_volume(self.id, {"name": new_name})

    def create_snapshot(self, name: str = "snapshot") -> dict[str, Any]:
        """Create a snapshot."""
        return self._client.create_volume_snapshot(self.id, name)

    def list_snapshots(self) -> list[dict[str, Any]]:
        """List snapshots."""
        return self._client.list_volume_snapshots(self.id)

    def __repr__(self) -> str:
        return f"Volume(id={self.id}, name={self.name})"


@dataclass
class Period:
    """Represents a time period."""

    seconds: int = 0
    minutes: int = 0
    hours: int = 0
    days: int = 0

    def __post_init__(self) -> None:
        self.total_seconds = self.seconds + self.minutes * 60 + self.hours * 3600 + self.days * 86400

    def __repr__(self) -> str:
        return f"Period(seconds={self.total_seconds})"


@dataclass
class Cron:
    """Represents a cron schedule."""

    cron_string: str

    def __repr__(self) -> str:
        return f"Cron('{self.cron_string}')"


@dataclass
class Proxy:
    """Represents a proxy configuration."""

    host: str
    port: int


@dataclass
class Probe:
    """Represents a health probe."""

    path: str = "/health"
    interval: int = 30


@dataclass
class NetworkFileSystem:
    """Represents a network file system mount."""

    name: str
    mount_path: str


@dataclass
class CloudBucketMount:
    """Represents a cloud bucket mount."""

    bucket_name: str
    mount_path: str
    provider: str = "s3"
