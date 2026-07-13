"""
Declarative API for Boxty — define your deployment entirely in code.

Usage::

    import boxty

    app = boxty.App("my-app")

    vol = boxty.Volume.from_name("model-weights")
    secret = boxty.Secret.from_name("huggingface-token")

    image = boxty.Image.debian_slim().pip_install("fastapi")

    @app.function(image=image, volumes={"/data": vol}, secrets=[secret])
    def my_handler():
        ...

    @app.web_endpoint(port=8000, image=image)
    def serve():
        ...
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from .client import Boxty


# ---------------------------------------------------------------------------
# Resource types
# ---------------------------------------------------------------------------


@dataclass
class Volume:
    """A persistent volume that survives across deployments.

    Use for data that must outlive individual sandbox runs —
    model weights, databases, uploaded files, etc.

    Contrast with :class:`Mount`, which is ephemeral workspace
    (local files uploaded per-run and destroyed afterwards).
    """

    name: str
    persistent: bool = True
    size_gb: int = 10
    volume_type: str = "block-storage"
    create_if_missing: bool = True

    @classmethod
    def from_name(cls, name: str, **kwargs: Any) -> Volume:
        return cls(name=name, **kwargs)

    @classmethod
    def persisted(cls, name: str, **kwargs: Any) -> Volume:
        """Explicitly create a persistent volume (same as ``from_name``)."""
        return cls(name=name, persistent=True, **kwargs)

    def to_manifest(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "persistent": self.persistent,
            "sizeGb": self.size_gb,
            "type": self.volume_type,
            "createIfMissing": self.create_if_missing,
        }


@dataclass
class Mount:
    """An ephemeral mount of local files into the sandbox workspace.

    These files are uploaded per-run and destroyed when the sandbox
    exits.  Use this for your application code, config files, and
    other data that ships with the deployment.

    Contrast with :class:`Volume`, which is persistent storage that
    survives across deployments.
    """

    local_dir: str = "."
    remote_path: str = "/workspace"
    include: list[str] = field(default_factory=list)
    exclude: list[str] = field(default_factory=list)

    @classmethod
    def from_local_dir(
        cls,
        local_dir: str = ".",
        *,
        remote_path: str = "/workspace",
        include: list[str] | None = None,
        exclude: list[str] | None = None,
    ) -> Mount:
        return cls(
            local_dir=local_dir,
            remote_path=remote_path,
            include=include or [],
            exclude=exclude or [],
        )

    def to_manifest(self) -> dict[str, Any]:
        m: dict[str, Any] = {
            "localDir": self.local_dir,
            "remotePath": self.remote_path,
        }
        if self.include:
            m["include"] = self.include
        if self.exclude:
            m["exclude"] = self.exclude
        return m


@dataclass
class Secret:
    name: str
    create_if_missing: bool = True

    @classmethod
    def from_name(cls, name: str, **kwargs: Any) -> Secret:
        return cls(name=name, **kwargs)

    def set_env(self, name: str, value: str) -> None:
        """Attach a key-value pair to this secret as an environment variable."""
        self._env_name = name
        self._env_value = value

    def to_manifest(self) -> dict[str, Any]:
        manifest = {"name": self.name, "createIfMissing": self.create_if_missing}
        if hasattr(self, "_env_name"):
            manifest["env_name"] = self._env_name
            manifest["env_value"] = self._env_value
        return manifest


@dataclass
class Database:
    name: str
    pk: str = "id"
    sk: str | None = None

    def to_manifest(self) -> dict[str, Any]:
        manifest: dict[str, Any] = {"name": self.name, "pk": self.pk}
        if self.sk:
            manifest["sk"] = self.sk
        return manifest


class Image:
    """Describes the container image for a function or endpoint.

    Chained builder API::

        Image("python:3.10").pip_install("fastapi").env({"MODEL": "llama3"})
        Image.debian_slim().pip_install("requests")
    """

    def __init__(self, base: str) -> None:
        self._base = base
        self._pip_packages: list[str] = []
        self._run_commands: list[str] = []
        self._env: dict[str, str] = {}
        self._python_version: str | None = None
        self._apt_packages: list[str] = []

    @classmethod
    def debian_slim(cls) -> Image:
        return cls("debian:slim")

    @classmethod
    def from_dockerfile(cls, tag: str) -> Image:
        return cls(tag)

    def pip_install(self, *packages: str) -> Image:
        self._pip_packages.extend(packages)
        return self

    def run_commands(self, *commands: str) -> Image:
        self._run_commands.extend(commands)
        return self

    def env(self, vars: dict[str, str]) -> Image:
        self._env.update(vars)
        return self

    def python_version(self, version: str) -> Image:
        self._python_version = version
        return self

    def apt_install(self, *packages: str) -> Image:
        self._apt_packages.extend(packages)
        return self

    def to_manifest(self) -> dict[str, Any]:
        manifest: dict[str, Any] = {"base": self._base}
        if self._pip_packages:
            manifest["pipPackages"] = self._pip_packages
        if self._run_commands:
            manifest["runCommands"] = self._run_commands
        if self._python_version:
            manifest["pythonVersion"] = self._python_version
        if self._apt_packages:
            manifest["aptPackages"] = self._apt_packages
        if self._env:
            manifest["env"] = self._env
        return manifest


# ---------------------------------------------------------------------------
# Decorated entities
# ---------------------------------------------------------------------------


@dataclass
class FunctionDef:
    name: str
    func: Callable[..., Any]
    image: Image | None = None
    mounts: list[Mount] = field(default_factory=list)
    volumes: dict[str, Volume] = field(default_factory=dict)
    secrets: list[Secret] = field(default_factory=list)
    timeout: int = 300
    gpu: str | None = None
    cpu_cores: int = 1
    memory_mb: int = 512
    disk_gb: int = 2
    _workload_id: str | None = field(default=None, repr=False)
    _client: Any = field(default=None, repr=False)

    def to_manifest(self) -> dict[str, Any]:
        manifest: dict[str, Any] = {
            "name": self.name,
            "timeout": self.timeout,
        }
        if self.image:
            manifest["image"] = self.image.to_manifest()
        if self.mounts:
            manifest["mounts"] = [m.to_manifest() for m in self.mounts]
        if self.volumes:
            manifest["volumes"] = {
                mount: vol.to_manifest() for mount, vol in self.volumes.items()
            }
        if self.secrets:
            manifest["secrets"] = [s.to_manifest() for s in self.secrets]
        if self.gpu:
            manifest["gpu"] = self.gpu
        return manifest

    def invoke(self, payload: Any | None = None, *, sync: bool = True) -> dict[str, Any]:
        """Invoke this function synchronously via the Boxty API.

        ``payload`` may be any JSON-serialisable value.  Returns the API
        response containing ``stdout``, ``stderr`` and ``return_code``.
        """
        if not self._workload_id:
            raise RuntimeError(f"Function '{self.name}' has not been deployed yet")
        if self._client is None:
            raise RuntimeError("No Boxty client available for invocation")
        if not sync:
            raise NotImplementedError("Only sync invocation is supported")
        return self._client.invoke_workload(self._workload_id, payload)


@dataclass
class WebEndpointDef:
    name: str
    func: Callable[..., Any]
    port: int = 8000
    image: Image | None = None
    mounts: list[Mount] = field(default_factory=list)
    volumes: dict[str, Volume] = field(default_factory=dict)
    secrets: list[Secret] = field(default_factory=list)
    timeout: int = 300
    gpu: str | None = None
    public: bool = True
    cpu_cores: int = 1
    memory_mb: int = 512
    disk_gb: int = 2
    _workload_id: str | None = field(default=None, repr=False)

    def to_manifest(self) -> dict[str, Any]:
        manifest: dict[str, Any] = {
            "name": self.name,
            "port": self.port,
            "timeout": self.timeout,
            "public": self.public,
        }
        if self.image:
            manifest["image"] = self.image.to_manifest()
        if self.mounts:
            manifest["mounts"] = [m.to_manifest() for m in self.mounts]
        if self.volumes:
            manifest["volumes"] = {
                mount: vol.to_manifest() for mount, vol in self.volumes.items()
            }
        if self.secrets:
            manifest["secrets"] = [s.to_manifest() for s in self.secrets]
        if self.gpu:
            manifest["gpu"] = self.gpu
        return manifest


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

_FUNCTIONS_ATTR = "__boxty_functions__"
_ENDPOINTS_ATTR = "__boxty_endpoints__"


class App:
    """Root object for a Boxty deployment.

    Collects functions, web endpoints, volumes, and secrets
    that make up your application.
    """

    def __init__(self, name: str = "my-app", image: str | Image | None = None) -> None:
        self.name = name
        self._image: Image | None = Image(image) if isinstance(image, str) else image
        self._functions: list[FunctionDef] = []
        self._endpoints: list[WebEndpointDef] = []
        self._volumes: dict[str, Volume] = {}
        self._secrets: list[Secret] = []

    # -- decorators -----------------------------------------------------------

    def function(
        self,
        *,
        image: Image | None = None,
        mounts: list[Mount] | None = None,
        volumes: dict[str, Volume] | None = None,
        secrets: list[Secret] | None = None,
        timeout: int = 300,
        gpu: str | None = None,
        cpu_cores: int = 1,
        memory_mb: int = 512,
        disk_gb: int = 2,
    ) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        """Decorator that registers a serverless function.

        ``mounts`` are ephemeral — local files uploaded per-run.
        ``volumes`` are persistent — data that survives across deployments.
        """

        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            fd = FunctionDef(
                name=fn.__name__,
                func=fn,
                image=image,
                mounts=mounts or [],
                volumes=volumes or {},
                secrets=secrets or [],
                timeout=timeout,
                gpu=gpu,
                cpu_cores=cpu_cores,
                memory_mb=memory_mb,
                disk_gb=disk_gb,
            )
            self._functions.append(fd)
            # Attach metadata to the function for serialization
            setattr(fn, _FUNCTIONS_ATTR, fd)
            return fn

        return decorator

    def web_endpoint(
        self,
        *,
        port: int = 8000,
        image: Image | None = None,
        mounts: list[Mount] | None = None,
        volumes: dict[str, Volume] | None = None,
        secrets: list[Secret] | None = None,
        timeout: int = 300,
        gpu: str | None = None,
        public: bool = True,
        cpu_cores: int = 1,
        memory_mb: int = 512,
        disk_gb: int = 2,
    ) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        """Decorator that registers an HTTP endpoint.

        The decorated function will be called when the endpoint is deployed.
        It should start an HTTP server on the given port.

        ``mounts`` are ephemeral — local files uploaded per-run.
        ``volumes`` are persistent — data that survives across deployments.
        """

        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            ed = WebEndpointDef(
                name=fn.__name__,
                func=fn,
                port=port,
                image=image,
                mounts=mounts or [],
                volumes=volumes or {},
                secrets=secrets or [],
                timeout=timeout,
                gpu=gpu,
                public=public,
                cpu_cores=cpu_cores,
                memory_mb=memory_mb,
                disk_gb=disk_gb,
            )
            self._endpoints.append(ed)
            setattr(fn, _ENDPOINTS_ATTR, ed)
            return fn

        return decorator

    # -- volume / secret helpers ----------------------------------------------

    def volume(
        self,
        name: str,
        size_gb: int = 10,
        volume_type: str = "block-storage",
        create_if_missing: bool = True,
    ) -> Volume:
        vol = Volume(
            name=name,
            size_gb=size_gb,
            volume_type=volume_type,
            create_if_missing=create_if_missing,
        )
        self._volumes[name] = vol
        return vol

    def secret(self, name: str, create_if_missing: bool = True) -> Secret:
        s = Secret(name=name, create_if_missing=create_if_missing)
        self._secrets.append(s)
        return s

    # -- manifest -------------------------------------------------------------

    def to_manifest(self) -> dict[str, Any]:
        """Serialize the entire app definition to a JSON-safe dict."""
        return {
            "name": self.name,
            "image": self._image.to_manifest() if self._image else None,
            "volumes": [v.to_manifest() for v in self._volumes.values()],
            "secrets": [s.to_manifest() for s in self._secrets],
            "functions": [f.to_manifest() for f in self._functions],
            "endpoints": [e.to_manifest() for e in self._endpoints],
        }

    def to_manifest_json(self) -> str:
        """Serialize the app definition to a JSON string for the CLI."""
        return json.dumps(self.to_manifest(), indent=2)

    # -- runtime --------------------------------------------------------------

    def run(self) -> None:
        """Run the app locally — serve all web endpoints.

        When ``boxty deploy`` spawns this module as a subprocess,
        it sets ``BOXTY_RUN_ENDPOINT=<name>`` to tell the module
        which endpoint to serve.
        """
        import os

        endpoint_name = os.environ.get("BOXTY_RUN_ENDPOINT")
        if endpoint_name:
            for ep in self._endpoints:
                if ep.name == endpoint_name:
                    ep.func()
                    return
            print(f"Error: endpoint '{endpoint_name}' not found in app", file=sys.stderr)
            sys.exit(1)

        # If no endpoint specified, serve the first one
        if self._endpoints:
            self._endpoints[0].func()
        else:
            print("Error: no web endpoints defined in app", file=sys.stderr)
            sys.exit(1)

    # ---------------------------------------------------------------------------
    # Docker / build helpers
    # ---------------------------------------------------------------------------

    def _build_dockerfile(self, image: Image) -> str:
        """Generate a Dockerfile that bakes the app code and the Boxty runtime."""
        import inspect
        from . import container_runtime

        manifest = image.to_manifest()
        base = manifest.get("base", "debian:slim")
        dockerfile = f"FROM {base}\n"
        dockerfile += "WORKDIR /app\n"

        # Install Python + pip if not a python base image; most of our bases will be python:*.
        if not base.startswith("python"):
            dockerfile += "RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*\n"

        # Install apt packages
        apt_packages = manifest.get("aptPackages")
        if apt_packages:
            dockerfile += f"RUN apt-get update && apt-get install -y {' '.join(apt_packages)} && rm -rf /var/lib/apt/lists/*\n"

        # Install pip packages
        pip_packages = manifest.get("pipPackages")
        if pip_packages:
            dockerfile += f"RUN pip install --no-cache-dir {' '.join(pip_packages)}\n"

        # Runtime dependencies for the shim (fastapi + uvicorn + httpx)
        dockerfile += "RUN pip install --no-cache-dir fastapi uvicorn httpx\n"

        # Environment variables
        env_vars = manifest.get("env") or {}
        for key, value in env_vars.items():
            dockerfile += f"ENV {key}={value}\n"

        # Copy the Boxty runtime shim into the image
        dockerfile += "COPY boxty_runtime.py /app/boxty_runtime.py\n"
        dockerfile += "COPY user_app.py /app/user_app.py\n"
        dockerfile += "COPY boxty.py /app/boxty.py\n"
        dockerfile += "EXPOSE 8000\n"
        dockerfile += "CMD [\"python\", \"/app/boxty_runtime.py\"]\n"
        return dockerfile

    def _package_app_source(self) -> str:
        import base64

        source_path = getattr(self, "_source_path", None)
        if not source_path or not Path(source_path).exists():
            import inspect
            for frame in inspect.stack():
                module = inspect.getmodule(frame[0])
                if module and module.__file__ and module.__file__.endswith(".py"):
                    source_path = module.__file__
                    break
        if not source_path or not Path(source_path).exists():
            raise RuntimeError("Could not locate the source file for the App being deployed")
        return base64.b64encode(Path(source_path).read_bytes()).decode("utf-8")

    def _boxty_stub_source(self) -> str:
        """Return a minimal boxty module that can be imported inside the container.

        The deployed user_app.py imports ``boxty`` and registers functions with
        ``App.function`` / ``App.web_endpoint``.  Inside the image we do not need
        the network client, just a stub that supports the same registration API.
        """
        return """\
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable

@dataclass
class Volume:
    name: str
    persistent: bool = True
    size_gb: int = 10
    volume_type: str = "block-storage"
    create_if_missing: bool = True

@dataclass
class Mount:
    local_dir: str = "."
    remote_path: str = "/workspace"
    include: list[str] = field(default_factory=list)
    exclude: list[str] = field(default_factory=list)

@dataclass
class Secret:
    name: str
    create_if_missing: bool = True

@dataclass
class Database:
    name: str
    pk: str = "id"
    sk: str | None = None

class Image:
    def __init__(self, base: str) -> None:
        self._base = base
        self._pip_packages: list[str] = []
    @classmethod
    def debian_slim(cls) -> Image:
        return cls("debian:slim")
    def pip_install(self, *packages: str) -> Image:
        self._pip_packages.extend(packages)
        return self
    def to_manifest(self) -> dict[str, Any]:
        return {"base": self._base, "pipPackages": self._pip_packages}

class App:
    def __init__(self, name: str = "my-app", image: str | Image | None = None) -> None:
        self.name = name
        self._functions: list[Any] = []
        self._endpoints: list[Any] = []

    def function(self, **kwargs: Any) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            self._functions.append(_FunctionDef(name=fn.__name__, func=fn))
            return fn
        return decorator

    def web_endpoint(self, **kwargs: Any) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            self._endpoints.append(_WebEndpointDef(name=fn.__name__, func=fn, port=kwargs.get("port", 8000)))
            return fn
        return decorator

    def local_entrypoint(self, fn: Callable[..., Any]) -> Callable[..., Any]:
        return fn


class _FunctionDef:
    def __init__(self, name: str, func: Callable[..., Any]) -> None:
        self.name = name
        self.func = func


class _WebEndpointDef:
    def __init__(self, name: str, func: Callable[..., Any], port: int = 8000) -> None:
        self.name = name
        self.func = func
        self.port = port
"""

    def deploy(
        self,
        *,
        workspace: str | None = None,
        environment: str | None = None,
        workspace_id: str | None = None,
        environment_id: str | None = None,
        app_name: str | None = None,
        client: Any | None = None,
    ) -> dict[str, Any]:
        """Deploy the app to Boxty.

        Builds images, creates function/endpoint workloads, and publishes
        routes for web endpoints.  Returns a dict with the created IDs.
        """
        def _load_config() -> dict[str, Any]:
            config_path = Path.home() / ".boxty" / "config.json"
            if config_path.exists():
                return json.loads(config_path.read_text())
            return {}

        config = _load_config()

        if client is None:
            token = os.environ.get("BOXTY_TOKEN") or config.get("token")
            base_url = os.environ.get("BOXTY_API_URL") or config.get("api_url")
            client = Boxty(base_url=base_url, token=token)

        # Resolve owner
        owner_id: str | None = None
        try:
            me = client.whoami()
            owner_id = me.get("user_id")
        except Exception:
            owner_id = os.environ.get("BOXTY_USER_ID") or config.get("user_id")
        if not owner_id:
            raise RuntimeError(
                "Unable to determine owner. Log in with 'boxty auth login' or set BOXTY_TOKEN."
            )

        # Resolve workspace
        workspace_id = workspace_id or workspace or config.get("workspace_id") or config.get("active_workspace_id")
        if not workspace_id:
            workspaces = client.workspaces(owner_id=owner_id)
            if workspaces:
                workspace_id = workspaces[0].get("workspace_id")
        if not workspace_id:
            raise RuntimeError("No workspace found. Create one with 'boxty workspace create'.")

        # Resolve environment
        environment_id = environment_id or environment or config.get("environment_id") or config.get("active_environment_id")
        if not environment_id:
            envs = client.environments(workspace_id)
            if envs:
                environment_id = envs[0].get("environment_id")
        if not environment_id:
            raise RuntimeError("No environment found. Create one with 'boxty environment create'.")

        name = app_name or self.name

        # Collect unique images and build them
        image_manifests: dict[str, Image] = {}
        image_keys: dict[int, str] = {}
        for item in (*self._functions, *self._endpoints):
            if not item.image:
                continue
            manifest = item.image.to_manifest()
            key = json.dumps(manifest, sort_keys=True)
            if key not in image_manifests:
                image_manifests[key] = item.image
            image_keys[id(item.image)] = key

        # Include a default image if no images were specified
        if not image_manifests:
            default_image = Image("python:3.11-slim")
            key = json.dumps(default_image.to_manifest(), sort_keys=True)
            image_manifests[key] = default_image

        image_key_to_id: dict[str, str] = {}
        app_source = self._package_app_source()
        from . import container_runtime
        import inspect
        runtime_source = base64.b64encode(inspect.getsource(container_runtime).encode("utf-8")).decode("utf-8")
        boxty_stub_source = base64.b64encode(self._boxty_stub_source().encode("utf-8")).decode("utf-8")

        for key, image in image_manifests.items():
            manifest = image.to_manifest()
            base = manifest.get("base", "debian:slim")
            image_name = f"{self.name}-{base.replace(':', '-').replace('/', '-')}"
            dockerfile = self._build_dockerfile(image)
            result = client.build_image(
                image_name,
                dockerfile=dockerfile,
                base_image=base,
                workspace_id=workspace_id,
                owner_id=owner_id,
                source_file_content=app_source,
                source_filename="user_app.py",
                extra_files={
                    "boxty_runtime.py": runtime_source,
                    "boxty.py": boxty_stub_source,
                },
            )
            image_key_to_id[key] = result["image_id"]

        # Poll images until ready
        timeout = 300
        start = time.time()
        pending = set(image_key_to_id.values())
        while pending and time.time() - start < timeout:
            for image_id in list(pending):
                info = client.get_image(image_id)
                status = info.get("status")
                if status == "ready":
                    pending.remove(image_id)
                elif status == "failed":
                    raise RuntimeError(
                        f"Image build failed for {image_id}: {info.get('build_log', '')}"
                    )
            if pending:
                time.sleep(2.0)
        if pending:
            raise RuntimeError(f"Timeout waiting for images to become ready: {pending}")

        def _resolve_image_ref(item: FunctionDef | WebEndpointDef) -> str:
            if not item.image:
                key = json.dumps(Image("python:3.11-slim").to_manifest(), sort_keys=True)
            else:
                key = image_keys.get(id(item.image))
            if key:
                image_id = image_key_to_id[key]
                info = client.get_image(image_id)
                return info.get("image_ref") or info.get("base_image") or "python:3.11-slim"
            return item.image.to_manifest().get("base", "python:3.11-slim") if item.image else "python:3.11-slim"

        # Helper to collect volume mounts and secret names for an item.
        created_volumes: dict[str, str] = {}
        created_secrets: set[str] = set()

        def _collect_volume_mounts(item: FunctionDef | WebEndpointDef) -> list[dict[str, Any]]:
            mounts: list[dict[str, Any]] = []
            for mount_path, vol in (item.volumes or {}).items():
                if vol.name not in created_volumes:
                    existing = {v.get("name") for v in client.list_volumes(workspace_id=workspace_id)}
                    if vol.name not in existing and vol.create_if_missing:
                        v = client.create_volume(
                            workspace_id=workspace_id,
                            name=vol.name,
                            size_gb=vol.size_gb,
                            volume_type=vol.volume_type,
                        )
                        created_volumes[vol.name] = v.get("volume_id", vol.name)
                    else:
                        created_volumes[vol.name] = vol.name
                mounts.append({
                    "locator": vol.name,
                    "mount_path": mount_path,
                    "read_only": False,
                })
            return mounts

        def _collect_secrets(item: FunctionDef | WebEndpointDef) -> list[str]:
            names: list[str] = []
            for sec in item.secrets or []:
                if sec.name not in created_secrets:
                    existing = {s.get("name") for s in client.list_secrets(workspace_id=workspace_id)}
                    if sec.name not in existing and sec.create_if_missing:
                        client.create_secret(workspace_id=workspace_id, name=sec.name, env_vars={})
                    created_secrets.add(sec.name)
                names.append(sec.name)
            return names

        # Create function workloads
        function_ids: dict[str, str] = {}
        for fn in self._functions:
            image_ref = _resolve_image_ref(fn)
            volume_mounts = _collect_volume_mounts(fn)
            secret_names = _collect_secrets(fn)
            result = client.create_workload(
                owner_id=owner_id,
                workspace_id=workspace_id,
                environment_id=environment_id,
                kind="function",
                image=image_ref,
                image_ref=image_ref,
                command=["python", "/app/boxty_runtime.py"],
                env={
                    "BOXTY_APP_MODULE": "/app/user_app.py",
                    "BOXTY_FUNCTION_NAME": fn.name,
                },
                secret_names=secret_names,
                volume_mounts=volume_mounts,
                metadata={
                    "function_name": fn.name,
                    "app": self.name,
                    "container_port": 8000,
                },
                cpu_cores=getattr(fn, "cpu_cores", 1),
                memory_mb=getattr(fn, "memory_mb", 512),
                disk_gb=getattr(fn, "disk_gb", 2),
                gpu_count=1 if fn.gpu else 0,
                gpu_type=fn.gpu,
            )
            fn._workload_id = result["workload_id"]
            fn._client = client
            function_ids[fn.name] = result["workload_id"]

        # Create endpoint workloads and publish routes
        endpoint_ids: dict[str, str] = {}
        route_ids: dict[str, str] = {}
        for ep in self._endpoints:
            image_ref = _resolve_image_ref(ep)
            volume_mounts = _collect_volume_mounts(ep)
            secret_names = _collect_secrets(ep)
            result = client.create_workload(
                owner_id=owner_id,
                workspace_id=workspace_id,
                environment_id=environment_id,
                kind="endpoint",
                image=image_ref,
                image_ref=image_ref,
                command=["python", "/app/boxty_runtime.py"],
                env={
                    "BOXTY_APP_MODULE": "/app/user_app.py",
                    "BOXTY_ENDPOINT_NAME": ep.name,
                },
                secret_names=secret_names,
                volume_mounts=volume_mounts,
                endpoint_name=ep.name,
                metadata={
                    "endpoint_name": ep.name,
                    "container_port": ep.port,
                    "app": self.name,
                },
                cpu_cores=getattr(ep, "cpu_cores", 1),
                memory_mb=getattr(ep, "memory_mb", 512),
                disk_gb=getattr(ep, "disk_gb", 2),
                gpu_count=1 if ep.gpu else 0,
                gpu_type=ep.gpu,
            )
            ep._workload_id = result["workload_id"]
            endpoint_ids[ep.name] = result["workload_id"]

            # Wait for the endpoint workload to be running so we know its origin_url.
            workload_id = result["workload_id"]
            deadline = time.time() + 60
            while time.time() < deadline:
                wl = client.get_workload(workload_id)
                if wl.get("status") == "running":
                    break
                time.sleep(1.0)
            else:
                raise RuntimeError(f"Timeout waiting for endpoint workload {workload_id} to start")

            route = client.create_route(
                workload_id,
                endpoint_name=ep.name,
                hostname=f"{ep.name}.{self.name}.boxty.dev",
                path_prefix="/",
            )
            route_ids[ep.name] = route["route_id"]

        return {
            "app": self.name,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "image_ids": list(image_key_to_id.values()),
            "function_ids": function_ids,
            "endpoint_ids": endpoint_ids,
            "route_ids": route_ids,
        }

    def local_entrypoint(self, fn: Callable[..., Any]) -> Callable[..., Any]:
        """Decorator for a local entrypoint function.

        This function runs locally and can call remote functions.
        """
        setattr(fn, "__boxty_local_entrypoint__", True)
        return fn

    def get_dashboard_url(self) -> str:
        """Get the dashboard URL for this app."""
        return f"https://boxty.io/dashboard/apps/{self.name}"

    @classmethod
    def lookup(cls, name: str, client: Any | None = None) -> App | FunctionDef | WebEndpointDef | None:
        """Lookup an existing app by name, or find a registered function/endpoint on this instance."""
        if isinstance(cls, App):
            for fn in cls._functions:
                if fn.name == name:
                    return fn
            for ep in cls._endpoints:
                if ep.name == name:
                    return ep
            return None
        return None

    def cls(
        self,
        *,
        image: Image | None = None,
        mounts: list[Mount] | None = None,
        volumes: dict[str, Volume] | None = None,
        secrets: list[Secret] | None = None,
        timeout: int = 300,
        gpu: str | None = None,
    ) -> Callable[[type], type]:
        """Decorator for a class-based function (Modal-style).

        The decorated class can have methods that are exposed as functions.
        """
        def decorator(cls_def: type) -> type:
            # Store metadata on the class
            setattr(cls_def, _FUNCTIONS_ATTR, {
                "image": image,
                "mounts": mounts or [],
                "volumes": volumes or {},
                "secrets": secrets or [],
                "timeout": timeout,
                "gpu": gpu,
            })
            return cls_def
        return decorator

    def server(
        self,
        *,
        port: int = 8000,
        image: Image | None = None,
        mounts: list[Mount] | None = None,
        volumes: dict[str, Volume] | None = None,
        secrets: list[Secret] | None = None,
        timeout: int = 300,
        gpu: str | None = None,
        public: bool = True,
    ) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        """Decorator for a persistent server (like web_endpoint but long-lived).

        Alias for web_endpoint for now.
        """
        return self.web_endpoint(
            port=port,
            image=image,
            mounts=mounts,
            volumes=volumes,
            secrets=secrets,
            timeout=timeout,
            gpu=gpu,
            public=public,
        )


# ---------------------------------------------------------------------------
# CLI integration helpers
# ---------------------------------------------------------------------------


def _find_app_in_module(mod_name: str) -> App | None:
    """Import a module by name and find the first ``App`` instance in it."""
    import importlib

    mod = importlib.import_module(mod_name)
    for _name, obj in vars(mod).items():
        if isinstance(obj, App):
            return obj
    return None


def _extract_manifest(mod_name: str) -> dict[str, Any] | None:
    """Helper used by the Rust CLI to extract the manifest from a Python module."""
    app = _find_app_in_module(mod_name)
    if app is None:
        return None
    return app.to_manifest()


# -- module-level decorators -------------------------------------------------

def concurrent(max_concurrency: int = 10) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to limit concurrent executions of a function.

    Usage::

        @boxty.concurrent(max_concurrency=5)
        @app.function()
        def my_func():
            ...
    """
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        setattr(fn, "__boxty_concurrent_limit__", max_concurrency)
        return fn
    return decorator


def batched(max_batch_size: int = 10, wait_ms: int = 100) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator to enable batching of function calls.

    Usage::

        @boxty.batched(max_batch_size=32, wait_ms=50)
        @app.function()
        def my_func(inputs: list[str]):
            ...
    """
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        setattr(fn, "__boxty_batched__", {"max_batch_size": max_batch_size, "wait_ms": wait_ms})
        return fn
    return decorator
