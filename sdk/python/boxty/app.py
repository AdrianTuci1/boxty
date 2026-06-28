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

import json
import sys
from dataclasses import dataclass, field
from typing import Any, Callable


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

    def to_manifest(self) -> dict[str, Any]:
        return {"name": self.name, "createIfMissing": self.create_if_missing}


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

    def __init__(self, name: str) -> None:
        self.name = name
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
            "image": None,  # global image if set across all fns; defer per-fn
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

    def deploy(self, *, workspace: str | None = None, environment: str | None = None) -> dict[str, Any]:
        """Deploy the app to Boxty.

        Returns the deployment result with workload IDs.
        """
        raise NotImplementedError("App.deploy() requires CLI integration")

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
    def lookup(cls, name: str, client: Any | None = None) -> App:
        """Lookup an existing app by name."""
        return cls(name)

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
