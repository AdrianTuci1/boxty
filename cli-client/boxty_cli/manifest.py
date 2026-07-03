from __future__ import annotations

import base64
import gzip
import importlib.util
import os
import sys
import textwrap
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class FunctionDefinition:
    name: str
    image: str
    command: list[str]
    env: dict[str, str] = field(default_factory=dict)
    timeout: int = 300
    resources: dict[str, Any] = field(default_factory=dict)
    mounts: list[dict[str, Any]] = field(default_factory=list)
    volumes: list[dict[str, Any]] = field(default_factory=list)
    secrets: list[str] = field(default_factory=list)

    def to_workload_payload(self, owner_id: str, workspace_id: str, environment_id: str, kind: str) -> dict[str, Any]:
        return {
            "owner_id": owner_id,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "kind": kind,
            "image": self.image,
            "command": self.command,
            "env": self.env,
            "resources": self.resources,
            "secret_names": self.secrets,
            "volume_mounts": self.volumes,
            "metadata": {"container_port": 8000},
        }


@dataclass
class EndpointDefinition:
    name: str
    image: str
    command: list[str]
    port: int = 8000
    env: dict[str, str] = field(default_factory=dict)
    timeout: int = 300
    resources: dict[str, Any] = field(default_factory=dict)
    mounts: list[dict[str, Any]] = field(default_factory=list)
    volumes: list[dict[str, Any]] = field(default_factory=list)
    secrets: list[str] = field(default_factory=list)

    def to_workload_payload(self, owner_id: str, workspace_id: str, environment_id: str, kind: str) -> dict[str, Any]:
        return {
            "owner_id": owner_id,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "kind": kind,
            "image": self.image,
            "command": self.command,
            "env": self.env,
            "endpoint_name": self.name,
            "resources": self.resources,
            "secret_names": self.secrets,
            "volume_mounts": self.volumes,
            "metadata": {"container_port": self.port},
        }


@dataclass
class SandboxDefinition:
    name: str
    image: str
    command: list[str] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)
    resources: dict[str, Any] = field(default_factory=dict)
    mounts: list[dict[str, Any]] = field(default_factory=list)
    volumes: list[dict[str, Any]] = field(default_factory=list)
    secrets: list[str] = field(default_factory=list)

    def to_workload_payload(self, owner_id: str, workspace_id: str, environment_id: str, kind: str) -> dict[str, Any]:
        return {
            "owner_id": owner_id,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "kind": kind,
            "image": self.image,
            "command": self.command or ["sleep", "infinity"],
            "env": self.env,
            "resources": self.resources,
            "secret_names": self.secrets,
            "volume_mounts": self.volumes,
            "metadata": {"container_port": 8000},
        }


class ManifestBuilder:
    """Imports an app.py module and extracts the Boxty App manifest."""

    def __init__(self, app_path: str | Path) -> None:
        self.app_path = Path(app_path).expanduser().resolve()
        self._app_dir = self.app_path.parent
        self._module = self._load_module()
        self._manifest = self._extract_manifest()

    def _load_module(self) -> Any:
        if not self.app_path.exists():
            raise FileNotFoundError(f"App file not found: {self.app_path}")
        module_name = self.app_path.stem
        spec = importlib.util.spec_from_file_location(module_name, self.app_path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Could not load module from {self.app_path}")
        module = importlib.util.module_from_spec(spec)
        app_dir = str(self._app_dir)
        if app_dir not in sys.path:
            sys.path.insert(0, app_dir)
        spec.loader.exec_module(module)
        return module

    def _extract_manifest(self) -> dict[str, Any]:
        app = self._find_app()
        if app is not None and hasattr(app, "to_manifest"):
            return app.to_manifest()
        if hasattr(self._module, "manifest"):
            return self._module.manifest
        raise RuntimeError(
            f"Could not find a Boxty App in {self.app_path}. "
            "Define an `app = boxty.App(...)` object or a `manifest` dict."
        )

    def _find_app(self) -> Any:
        import boxty
        for name, obj in vars(self._module).items():
            if isinstance(obj, boxty.App):
                return obj
        return None

    @property
    def app_dir(self) -> Path:
        return self._app_dir

    def _image_from_sdk(self, image: Any) -> str:
        if image is None:
            chosen = "python:3.11-slim"
        elif isinstance(image, str):
            chosen = image
        elif isinstance(image, dict):
            chosen = image.get("base", "python:3.11-slim")
        elif hasattr(image, "to_manifest"):
            chosen = image.to_manifest().get("base", "python:3.11-slim")
        else:
            chosen = str(image)
        # Use a runner image that has the Python SDK preinstalled.
        if chosen in {"python:3.11-slim", "python:3.11", "python:3.12-slim"}:
            return "boxty-python-runner"
        return chosen

    def _resources(self, manifest: dict[str, Any]) -> dict[str, Any]:
        return {
            "cpu_cores": manifest.get("cpu_cores", 1),
            "memory_mb": manifest.get("memory_mb", 512),
            "disk_gb": manifest.get("disk_gb", 2),
            "gpu_count": manifest.get("gpu_count", 0),
            "gpu_type": manifest.get("gpu_type"),
        }

    def _is_node_image(self, image: str) -> bool:
        return "node" in image.lower()

    def _source_payload(self) -> str:
        """Return the app source code as a base64-encoded, gzip-compressed payload."""
        source = self.app_path.read_text()
        compressed = gzip.compress(source.encode("utf-8"))
        return base64.b64encode(compressed).decode("ascii")

    def _node_server_payload(self) -> str | None:
        """Return the companion server.js (if present) as a base64-encoded gzip payload."""
        server_js = self.app_path.parent / "server.js"
        if not server_js.exists():
            return None
        compressed = gzip.compress(server_js.read_text().encode("utf-8"))
        return base64.b64encode(compressed).decode("ascii")

    def _python_inline_command(self, run_stmt: str) -> list[str]:
        """Return a docker-friendly python -c command that executes run_stmt in the app module context."""
        payload = self._source_payload()
        return [
            "python", "-c",
            (
                "import base64, gzip; "
                f"src = gzip.decompress(base64.b64decode('{payload}')); "
                f"ns = {{'__name__': '__main__', '__file__': '/workspace/{self.app_path.name}'}}; "
                f"exec(compile(src, '/workspace/{self.app_path.name}', 'exec'), ns); "
                f"app = ns['app']; "
                + run_stmt
            ),
        ]

    def _node_inline_command(self, run_stmt: str) -> list[str]:
        """Return a docker-friendly node -e command that executes run_stmt in the app module context."""
        payload = self._source_payload()
        server_payload = self._node_server_payload()
        name = self.app_path.name
        if server_payload:
            # If a server.js exists, decode it to /workspace/server.js and run it.
            server_b64 = server_payload
            return [
                "node", "-e",
                (
                    "const fs = require('fs'); "
                    "const zlib = require('zlib'); "
                    f"const appSrc = zlib.gunzipSync(Buffer.from('{payload}', 'base64')).toString('utf8'); "
                    f"const serverSrc = zlib.gunzipSync(Buffer.from('{server_b64}', 'base64')).toString('utf8'); "
                    "fs.mkdirSync('/workspace', { recursive: true }); "
                    "fs.writeFileSync('/workspace/app.py', appSrc); "
                    "fs.writeFileSync('/workspace/server.js', serverSrc); "
                    "require('/workspace/server.js');"
                ),
            ]
        return [
            "node", "-e",
            (
                "const zlib = require('zlib'); "
                f"const src = zlib.gunzipSync(Buffer.from('{payload}', 'base64')).toString('utf8'); "
                "const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', src); "
                f"const mod = new (require('module').Module)('/workspace/{name}'); "
                f"fn(require, mod, mod.exports, '/workspace', '/workspace/{name}'); "
                + run_stmt
            ),
        ]

    def _mounts(self, obj: Any) -> list[dict[str, Any]]:
        """Return SDK Mount objects as plain dicts. We no longer need the app directory mount."""
        mounts: list[dict[str, Any]] = []
        raw_mounts = getattr(obj, "mounts", []) if hasattr(obj, "mounts") else obj.get("mounts", [])
        for m in raw_mounts:
            if hasattr(m, "to_manifest"):
                mounts.append(m.to_manifest())
            elif isinstance(m, dict):
                mounts.append(m)
        return mounts

    def _convert_function(self, fdef: Any) -> FunctionDefinition:
        if hasattr(fdef, "name"):
            name = fdef.name
            image = self._image_from_sdk(getattr(fdef, "image", None))
            timeout = getattr(fdef, "timeout", 300)
            secrets = [getattr(s, "name", s) for s in getattr(fdef, "secrets", [])]
            volumes = [v.to_manifest() if hasattr(v, "to_manifest") else v for v in getattr(fdef, "volumes", {}).values()]
            resources = self._resources(getattr(fdef, "to_manifest", lambda: {})())
        else:
            name = fdef.get("name", "fn")
            image = self._image_from_sdk(fdef.get("image"))
            timeout = fdef.get("timeout", 300)
            secrets = fdef.get("secrets", [])
            volumes = fdef.get("volumes", [])
            resources = self._resources(fdef)

        if self._is_node_image(image):
            command = self._node_inline_command(f"app._functions.find(f=>f.name==='{name}').func()")
        else:
            command = self._python_inline_command(
                f"fn = next(f for f in app._functions if f.name == '{name}'); print(fn.func())"
            )

        return FunctionDefinition(
            name=name,
            image=image,
            command=command,
            timeout=timeout,
            secrets=secrets,
            volumes=volumes,
            resources=resources,
        )

    def _convert_endpoint(self, edef: Any) -> EndpointDefinition:
        if hasattr(edef, "name"):
            name = edef.name
            image = self._image_from_sdk(getattr(edef, "image", None))
            port = getattr(edef, "port", 8000)
            timeout = getattr(edef, "timeout", 300)
            secrets = [getattr(s, "name", s) for s in getattr(edef, "secrets", [])]
            volumes = [v.to_manifest() if hasattr(v, "to_manifest") else v for v in getattr(edef, "volumes", {}).values()]
            resources = self._resources(getattr(edef, "to_manifest", lambda: {})())
        else:
            name = edef.get("name", "ep")
            image = self._image_from_sdk(edef.get("image"))
            port = edef.get("port", 8000)
            timeout = edef.get("timeout", 300)
            secrets = edef.get("secrets", [])
            volumes = edef.get("volumes", [])
            resources = self._resources(edef)

        if self._is_node_image(image):
            command = self._node_inline_command("app.run()")
        else:
            command = self._python_inline_command("app.run()")

        return EndpointDefinition(
            name=name,
            image=image,
            command=command,
            port=port,
            timeout=timeout,
            secrets=secrets,
            volumes=volumes,
            resources=resources,
        )

    def get_function(self, name: str | None = None) -> FunctionDefinition:
        functions = self._manifest.get("functions", [])
        if not functions:
            raise RuntimeError("No functions defined in app")
        if name is None:
            return self._convert_function(functions[0])
        for f in functions:
            if (hasattr(f, "name") and f.name == name) or f.get("name") == name:
                return self._convert_function(f)
        raise RuntimeError(f"Function '{name}' not found in app")

    def get_endpoint(self, name: str | None = None) -> EndpointDefinition:
        endpoints = self._manifest.get("endpoints", [])
        if not endpoints:
            raise RuntimeError("No endpoints defined in app")
        if name is None:
            return self._convert_endpoint(endpoints[0])
        for e in endpoints:
            if (hasattr(e, "name") and e.name == name) or e.get("name") == name:
                return self._convert_endpoint(e)
        raise RuntimeError(f"Endpoint '{name}' not found in app")

    @property
    def manifest(self) -> dict[str, Any]:
        return self._manifest

    def get_sandbox(self, name: str | None = None) -> SandboxDefinition:
        sandboxes = self._manifest.get("sandboxes", [])
        if sandboxes:
            s = sandboxes[0] if name is None else next(
                (x for x in sandboxes if (x.get("name") == name or getattr(x, "name", None) == name)),
                sandboxes[0],
            )
            return SandboxDefinition(
                name=s.get("name", "sandbox"),
                image=self._image_from_sdk(s.get("image")),
                command=s.get("command", []),
                resources=self._resources(s),
            )
        if self._manifest.get("functions"):
            fn = self.get_function()
            return SandboxDefinition(name=fn.name, image=fn.image, resources=fn.resources)
        if self._manifest.get("endpoints"):
            ep = self.get_endpoint()
            return SandboxDefinition(name=ep.name, image=ep.image, resources=ep.resources)
        raise RuntimeError("No functions or endpoints defined; cannot infer sandbox image")
