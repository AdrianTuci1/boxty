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
        # Placeholder: would read from environment/context
        raise NotImplementedError("Workspace.from_context() requires runtime context")

    def members(self) -> list[dict[str, Any]]:
        """List workspace members."""
        return self._client.list_invites(workspace_id=self.id)

    def billing_report(self) -> dict[str, Any]:
        """Get billing report for this workspace."""
        # Would call billing endpoint with workspace filter
        raise NotImplementedError("Workspace billing not yet implemented in backend")

    def proxy_tokens(self) -> ProxyTokenManager:
        """Manage proxy tokens for this workspace."""
        return ProxyTokenManager(self._client, self.id)


@dataclass
class ProxyTokenManager:
    """Manages proxy tokens for a workspace."""

    _client: Any = field(repr=False)
    _workspace_id: str = field(repr=False)

    def create(self, name: str) -> dict[str, Any]:
        raise NotImplementedError("Proxy tokens not yet implemented in backend")

    def list(self) -> list[dict[str, Any]]:
        raise NotImplementedError("Proxy tokens not yet implemented in backend")

    def allow(self, token_id: str) -> dict[str, Any]:
        raise NotImplementedError("Proxy tokens not yet implemented in backend")

    def revoke(self, token_id: str) -> dict[str, Any]:
        raise NotImplementedError("Proxy tokens not yet implemented in backend")

    def delete(self, token_id: str) -> dict[str, Any]:
        raise NotImplementedError("Proxy tokens not yet implemented in backend")


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
        raise NotImplementedError("Environment RBAC not yet implemented in backend")

    def billing_report(self) -> dict[str, Any]:
        """Get billing report for this environment."""
        raise NotImplementedError("Environment billing not yet implemented in backend")


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
        secrets = []
        try:
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        s = client.secrets.create(key.strip(), value.strip())
                        secrets.append(cls(client, s["id"], s["name"], value.strip()))
        except FileNotFoundError:
            pass
        return secrets

    def update(self, value: str) -> dict[str, Any]:
        """Update the secret value."""
        return self._client.secrets.update(self.id, value)

    def info(self) -> dict[str, Any]:
        """Get secret info."""
        return self._client.secrets.get(self.id)

    def objects(self) -> ObjectManager:
        """Manage secret objects."""
        return ObjectManager(self._client, self.id)


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
        """Create a Debian slim base image."""
        return cls(client, None, f"debian-slim-python{python_version}", base_image=f"python:{python_version}-slim")

    @classmethod
    def from_registry(cls, client: Any, tag: str) -> Image:
        """Create an image from a registry tag."""
        return cls(client, None, tag, base_image=tag)

    @classmethod
    def from_id(cls, client: Any, image_id: str) -> Image:
        """Get an image by ID."""
        img = client.get_image(image_id)
        return cls(client, image_id, img.get("name", ""), base_image=img.get("base_image"))

    def build(self) -> dict[str, Any]:
        """Build the image."""
        return self._client.build_image(self.name, self.dockerfile, self.base_image)

    def pip_install(self, *packages: str) -> Image:
        """Add pip packages to the image."""
        # Would modify image definition
        return self

    def uv_pip_install(self, *packages: str) -> Image:
        """Add pip packages using uv."""
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
        """Sync using uv."""
        return self

    def add_local_file(self, local_path: str, remote_path: str) -> Image:
        """Add a local file to the image."""
        return self

    def add_local_dir(self, local_path: str, remote_path: str) -> Image:
        """Add a local directory to the image."""
        return self

    def add_local_python_source(self, module_name: str, path: str) -> Image:
        """Add local Python source code."""
        return self


@dataclass
class Sandbox:
    """Represents a Boxty sandbox session."""

    _client: Any = field(repr=False)
    id: str
    workload_id: str
    token: str | None = None

    @classmethod
    def create(
        cls,
        client: Any,
        workload_id: str,
        requester_id: str,
        ttl_seconds: int = 900,
    ) -> Sandbox:
        """Create a new sandbox session."""
        result = client.create_sandbox_session(workload_id, requester_id, ttl_seconds)
        return cls(client, result["id"], workload_id, result.get("token"))

    @classmethod
    def from_name(cls, client: Any, name: str) -> Sandbox:
        """Get sandbox by name."""
        raise NotImplementedError("Sandbox.from_name() not yet implemented")

    @classmethod
    def from_id(cls, client: Any, sandbox_id: str) -> Sandbox:
        """Get sandbox by ID."""
        raise NotImplementedError("Sandbox.from_id() not yet implemented")

    def wait(self, timeout: float = 60.0) -> Sandbox:
        """Wait for sandbox to be ready."""
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

    def exec(self, command: list[str]) -> dict[str, Any]:
        """Execute a command in the sandbox."""
        raise NotImplementedError("Sandbox.exec() not yet implemented in backend")

    def tunnels(self) -> list[dict[str, Any]]:
        """Get active tunnels."""
        raise NotImplementedError("Sandbox tunnels not yet implemented in backend")

    def create_connect_token(self) -> str:
        """Create a connection token."""
        raise NotImplementedError("Sandbox connect tokens not yet implemented")

    def snapshot_filesystem(self) -> dict[str, Any]:
        """Snapshot the filesystem."""
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
        """Access filesystem operations."""
        return FileSystemManager(self._client, self.id, self.workload_id)


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
        """Call the function remotely with generator."""
        raise NotImplementedError("Function.remote_gen() requires runtime context")

    def local(self, *args: Any, **kwargs: Any) -> Any:
        """Call the function locally."""
        if self._func is None:
            raise ValueError("No local function bound")
        return self._func(*args, **kwargs)

    def spawn(self, *args: Any, **kwargs: Any) -> Any:
        """Spawn a remote function call."""
        raise NotImplementedError("Function.spawn() requires runtime context")

    def map(self, inputs: list[Any]) -> list[Any]:
        """Map function over inputs."""
        raise NotImplementedError("Function.map() requires runtime context")

    def starmap(self, inputs: list[tuple[Any, ...]]) -> list[Any]:
        """Map function over tuple inputs."""
        raise NotImplementedError("Function.starmap() requires runtime context")

    def for_each(self, inputs: list[Any]) -> None:
        """Call function for each input."""
        raise NotImplementedError("Function.for_each() requires runtime context")

    def spawn_map(self, inputs: list[Any]) -> list[Any]:
        """Spawn map operation."""
        raise NotImplementedError("Function.spawn_map() requires runtime context")

    def get_web_url(self) -> str:
        """Get web URL for the function."""
        raise NotImplementedError("Function.get_web_url() not yet implemented")

    def with_options(self, **kwargs: Any) -> Function:
        """Create a copy with different options."""
        return self

    def with_concurrency(self, limit: int) -> Function:
        """Set concurrency limit."""
        return self

    def with_batching(self, max_size: int, wait_ms: int) -> Function:
        """Enable batching."""
        return self

    def update_autoscaler(self, min_containers: int, max_containers: int) -> dict[str, Any]:
        """Update autoscaler settings."""
        raise NotImplementedError("Autoscaler not yet implemented in backend")

    def get_current_stats(self) -> dict[str, Any]:
        """Get current function stats."""
        raise NotImplementedError("Function stats not yet implemented")


@dataclass
class Volume:
    """Represents a Boxty volume."""

    _client: Any = field(repr=False)
    id: str
    name: str

    @classmethod
    def from_name(cls, client: Any, name: str) -> Volume:
        """Get a volume by name."""
        volumes = client.volumes.list()
        for v in volumes:
            if v.get("name") == name:
                return cls(client, v["id"], v["name"])
        raise ValueError(f"Volume '{name}' not found")

    @classmethod
    def from_id(cls, client: Any, volume_id: str) -> Volume:
        """Get a volume by ID."""
        v = client.volumes.get(volume_id)
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
        v = self._client.volumes.get(self.id)
        self.name = v.get("name", self.name)
        return self

    def listdir(self, path: str = "/") -> list[str]:
        """List directory contents."""
        raise NotImplementedError("Volume listdir not yet implemented")

    def read_file(self, path: str) -> bytes:
        """Read a file from the volume."""
        raise NotImplementedError("Volume read_file not yet implemented")

    def remove_file(self, path: str) -> dict[str, Any]:
        """Remove a file from the volume."""
        raise NotImplementedError("Volume remove_file not yet implemented")

    def copy_files(self, src: str, dst: str) -> dict[str, Any]:
        """Copy files within the volume."""
        raise NotImplementedError("Volume copy_files not yet implemented")

    def batch_upload(self, files: dict[str, bytes]) -> dict[str, Any]:
        """Batch upload files."""
        raise NotImplementedError("Volume batch_upload not yet implemented")

    def rename(self, new_name: str) -> dict[str, Any]:
        """Rename the volume."""
        return self._client.volumes.update(self.id, name=new_name)


class Period:
    """Represents a time period for scheduling."""

    def __init__(self, seconds: float = 0, minutes: float = 0, hours: float = 0, days: float = 0) -> None:
        self.seconds = seconds + minutes * 60 + hours * 3600 + days * 86400

    def __repr__(self) -> str:
        return f"Period(seconds={self.seconds})"


class Cron:
    """Represents a cron schedule."""

    def __init__(self, cron_string: str) -> None:
        self.cron_string = cron_string

    def __repr__(self) -> str:
        return f"Cron('{self.cron_string}')"


class Proxy:
    """Represents a proxy configuration."""

    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port


class Probe:
    """Represents a health probe."""

    def __init__(self, path: str = "/health", interval: int = 30) -> None:
        self.path = path
        self.interval = interval


class NetworkFileSystem:
    """Represents a network file system mount."""

    def __init__(self, name: str, mount_path: str) -> None:
        self.name = name
        self.mount_path = mount_path


class CloudBucketMount:
    """Represents a cloud bucket mount."""

    def __init__(self, bucket_name: str, mount_path: str, provider: str = "s3") -> None:
        self.bucket_name = bucket_name
        self.mount_path = mount_path
        self.provider = provider
