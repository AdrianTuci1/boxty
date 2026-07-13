from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


class ContainerRunner(Protocol):
    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]: ...


class _DefaultContainerRunner:
    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
        return subprocess.run(args, capture_output=capture_output, text=True)


@dataclass
class LaunchResult:
    status: str
    runtime_details: dict[str, Any] = field(default_factory=dict)


@dataclass
class WarmContainer:
    container_id: str
    image: str
    command: list[str]
    workload_id: str | None = None
    in_use: bool = False
    last_used: float = field(default_factory=time.time)

    def matches(self, image: str, command: list[str]) -> bool:
        return self.image == image and self.command == command


class ContainerWorkerRuntime:
    """Docker/Podman runtime that supports warm containers for fast starts.

    The runtime keeps a small pool of idle containers per ``(image, command)`` key.
    When a workload arrives, it tries to reuse a warm container; otherwise it
    starts a new one. This makes endpoints and sandboxes start in under a second
    when the image is already present on the worker.
    """

    def __init__(self, runner: ContainerRunner | None = None, runtime: str = "docker") -> None:
        self._runner = runner or _DefaultContainerRunner()
        self._binary = self._detect_runtime(runtime)
        self._warm: dict[str, list[WarmContainer]] = {}
        self._max_warm_per_key = 2

    def _detect_runtime(self, preferred: str) -> str:
        for binary in [preferred, "docker", "podman", "nerdctl"]:
            if shutil.which(binary):
                return binary
        raise RuntimeError("No container runtime found (tried docker, podman, nerdctl)")

    # ------------------------------------------------------------------
    # Image management
    # ------------------------------------------------------------------

    def list_local_images(self) -> list[str]:
        """Return the list of images that are already pulled on this worker."""
        try:
            result = self._runner.run([self._binary, "images", "--format", "{{.Repository}}:{{.Tag}}"])
            if result.returncode != 0:
                return []
            images: list[str] = []
            for line in result.stdout.strip().splitlines():
                line = line.strip()
                if line and line != "<none>:<none>":
                    images.append(line)
            # Also include image IDs for images built locally without tags.
            result = self._runner.run([self._binary, "images", "--format", "{{.ID}}"])
            if result.returncode == 0:
                for line in result.stdout.strip().splitlines():
                    line = line.strip()
                    if line:
                        images.append(line)
            return images
        except Exception:
            return []

    def ensure_image(self, image: str) -> None:
        """Pull the image if it is not already present locally."""
        try:
            result = self._runner.run([self._binary, "image", "inspect", image], capture_output=True)
            if result.returncode == 0:
                return
        except Exception:
            pass
        self._runner.run([self._binary, "pull", image])

    # ------------------------------------------------------------------
    # Warm pool
    # ------------------------------------------------------------------

    def _warm_key(self, image: str, command: list[str]) -> str:
        return json.dumps({"image": image, "command": command}, sort_keys=True)

    def _warm_command(self, image: str) -> list[str]:
        """Command used for warm containers. They sleep until a workload claims them."""
        return ["sleep", "3600"]

    def warm_images(self, images: list[str], max_warm: int = 2) -> None:
        """Pre-start idle containers for a list of images so future workloads start fast."""
        self._max_warm_per_key = max_warm
        for image in images:
            self.ensure_image(image)
            key = self._warm_key(image, self._warm_command(image))
            existing = [c for c in self._warm.get(key, []) if not c.in_use]
            needed = max(0, self._max_warm_per_key - len(existing))
            for _ in range(needed):
                try:
                    container_id = self._start_detached(image, self._warm_command(image), name=None)
                    warm = WarmContainer(
                        container_id=container_id,
                        image=image,
                        command=self._warm_command(image),
                    )
                    self._warm.setdefault(key, []).append(warm)
                except Exception:
                    pass

    def _claim_warm(self, image: str, command: list[str]) -> str | None:
        """Return a warm container ID and mark it in-use, or None if no warm container is ready."""
        warm_key = self._warm_key(image, self._warm_command(image))
        pool = self._warm.get(warm_key, [])
        for c in pool:
            if not c.in_use:
                c.in_use = True
                c.last_used = time.time()
                return c.container_id
        return None

    def _release_warm(self, container_id: str, remove: bool = True) -> None:
        for pool in self._warm.values():
            for c in pool:
                if c.container_id == container_id:
                    c.in_use = False
                    c.last_used = time.time()
                    if remove:
                        try:
                            self._runner.run([self._binary, "rm", "-f", container_id], capture_output=True)
                        except Exception:
                            pass
                        pool.remove(c)
                    return

    def prune_warm(self, max_age_seconds: float = 300.0) -> None:
        """Remove warm containers that have been idle too long."""
        now = time.time()
        for pool in list(self._warm.values()):
            for c in list(pool):
                if c.in_use:
                    continue
                if now - c.last_used > max_age_seconds:
                    try:
                        self._runner.run([self._binary, "rm", "-f", c.container_id], capture_output=True)
                    except Exception:
                        pass
                    pool.remove(c)

    # ------------------------------------------------------------------
    # Container helpers
    # ------------------------------------------------------------------

    def _reserve_local_port(self) -> int:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
        sock.close()
        return port

    def _container_name(self, workload_id: str) -> str:
        return f"boxty-{workload_id}"

    def _start_detached(self, image: str, command: list[str], *, name: str | None, env: dict[str, str] | None = None, port_mapping: tuple[int, int] | None = None) -> str:
        args = [self._binary, "run", "-d", "--rm"]
        if name:
            args.extend(["--name", name])
        if env:
            for k, v in env.items():
                args.extend(["-e", f"{k}={v}"])
        if port_mapping:
            host_port, container_port = port_mapping
            args.extend(["-p", f"127.0.0.1:{host_port}:{container_port}"])
        args.append(image)
        args.extend(command)
        result = self._runner.run(args)
        if result.returncode != 0:
            raise RuntimeError(f"Failed to start container: {result.stderr}")
        return result.stdout.strip()

    def _exec_in_container(self, container_id: str, command: list[str]) -> subprocess.CompletedProcess[str]:
        return self._runner.run([self._binary, "exec", container_id, *command])

    def _wait_for_health(self, origin_url: str, timeout: float = 30.0) -> bool:
        deadline = time.time() + timeout
        import urllib.request

        while time.time() < deadline:
            try:
                with urllib.request.urlopen(f"{origin_url}/health", timeout=2.0) as resp:
                    if resp.status == 200:
                        return True
            except Exception:
                pass
            time.sleep(0.2)
        return False

    # ------------------------------------------------------------------
    # Public launch API
    # ------------------------------------------------------------------

    def launch(self, workload: dict[str, Any]) -> LaunchResult:
        kind = workload.get("kind", "sandbox")
        image = workload.get("image_ref") or workload.get("image")
        command = workload.get("command") or []
        env = workload.get("env") or {}
        workload_id = workload["workload_id"]

        if not image:
            return LaunchResult(status="failed", runtime_details={"error": "no image specified"})

        self.ensure_image(image)

        if kind == "sandbox":
            return self._launch_sandbox(workload, image, command, env)

        if kind == "function":
            return self._launch_function(workload, image, command, env)

        if kind == "endpoint":
            return self._launch_endpoint(workload, image, command, env)

        return LaunchResult(status="failed", runtime_details={"error": f"unknown workload kind {kind}"})

    def _launch_sandbox(self, workload: dict[str, Any], image: str, command: list[str], env: dict[str, str]) -> LaunchResult:
        workload_id = workload["workload_id"]
        container_name = self._container_name(workload_id)
        # Prefer a warm container and rename it to the workload name.
        warm_id = self._claim_warm(image, command)
        if warm_id:
            try:
                self._runner.run([self._binary, "rename", warm_id, container_name], capture_output=True)
                # Warm containers run 'sleep 3600'; exec the requested command inside.
                if command:
                    self._exec_in_container(container_name, command)
                container_id = container_name
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})
        else:
            cmd = command if command else ["sleep", "3600"]
            try:
                container_id = self._start_detached(image, cmd, name=container_name, env=env)
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})

        return LaunchResult(
            status="running",
            runtime_details={
                "container_runtime": self._binary,
                "container_id": container_id,
                "attach_command": f"{self._binary} exec -it {container_id} /bin/sh",
            },
        )

    def _launch_function(self, workload: dict[str, Any], image: str, command: list[str], env: dict[str, str]) -> LaunchResult:
        workload_id = workload["workload_id"]
        container_name = self._container_name(workload_id)
        host_port = self._reserve_local_port()
        container_port = 8000

        warm_id = self._claim_warm(image, command)
        if warm_id:
            try:
                self._runner.run([self._binary, "rename", warm_id, container_name], capture_output=True)
                # Warm container runs sleep; we need to restart it with the right command and env.
                # Docker does not support changing env/ports on a running container, so we commit the
                # warm container to a new image and start a fresh one. This still avoids the initial
                # image pull and is much faster than a cold start.
                committed_image = f"boxty-warm:{warm_id[:12]}"
                self._runner.run([self._binary, "commit", "-p", warm_id, committed_image], capture_output=True)
                self._runner.run([self._binary, "rm", "-f", warm_id], capture_output=True)
                self._release_warm(warm_id, remove=False)
                container_id = self._start_detached(
                    committed_image,
                    command if command else ["python", "/app/boxty_runtime.py"],
                    name=container_name,
                    env=env,
                    port_mapping=(host_port, container_port),
                )
                image = committed_image
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})
        else:
            try:
                container_id = self._start_detached(
                    image,
                    command if command else ["python", "/app/boxty_runtime.py"],
                    name=container_name,
                    env=env,
                    port_mapping=(host_port, container_port),
                )
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})

        origin_url = f"http://127.0.0.1:{host_port}"
        healthy = self._wait_for_health(origin_url, timeout=30.0)
        if not healthy:
            return LaunchResult(
                status="failed",
                runtime_details={
                    "container_id": container_id,
                    "error": "health check failed",
                    "origin_url": origin_url,
                },
            )

        return LaunchResult(
            status="running",
            runtime_details={
                "container_runtime": self._binary,
                "container_id": container_id,
                "host_port": host_port,
                "container_port": container_port,
                "origin_url": origin_url,
            },
        )

    def _launch_endpoint(self, workload: dict[str, Any], image: str, command: list[str], env: dict[str, str]) -> LaunchResult:
        workload_id = workload["workload_id"]
        container_name = self._container_name(workload_id)
        host_port = self._reserve_local_port()
        container_port = workload.get("metadata", {}).get("container_port", 8000)

        warm_id = self._claim_warm(image, command)
        if warm_id:
            try:
                self._runner.run([self._binary, "rename", warm_id, container_name], capture_output=True)
                committed_image = f"boxty-warm:{warm_id[:12]}"
                self._runner.run([self._binary, "commit", "-p", warm_id, committed_image], capture_output=True)
                self._runner.run([self._binary, "rm", "-f", warm_id], capture_output=True)
                self._release_warm(warm_id, remove=False)
                container_id = self._start_detached(
                    committed_image,
                    command if command else ["python", "/app/boxty_runtime.py"],
                    name=container_name,
                    env=env,
                    port_mapping=(host_port, container_port),
                )
                image = committed_image
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})
        else:
            try:
                container_id = self._start_detached(
                    image,
                    command if command else ["python", "/app/boxty_runtime.py"],
                    name=container_name,
                    env=env,
                    port_mapping=(host_port, container_port),
                )
            except Exception as exc:
                return LaunchResult(status="failed", runtime_details={"error": str(exc)})

        origin_url = f"http://127.0.0.1:{host_port}"
        healthy = self._wait_for_health(origin_url, timeout=30.0)
        if not healthy:
            return LaunchResult(
                status="failed",
                runtime_details={
                    "container_id": container_id,
                    "error": "health check failed",
                    "origin_url": origin_url,
                },
            )

        return LaunchResult(
            status="running",
            runtime_details={
                "container_runtime": self._binary,
                "container_id": container_id,
                "host_port": host_port,
                "container_port": container_port,
                "origin_url": origin_url,
            },
        )

    def stop(self, container_id: str) -> None:
        try:
            self._runner.run([self._binary, "rm", "-f", container_id], capture_output=True)
        except Exception:
            pass
        self._release_warm(container_id, remove=False)
