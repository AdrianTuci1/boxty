from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from .config import settings


class CommandRunner(Protocol):
    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
        ...


class SubprocessRunner:
    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            args,
            check=True,
            text=True,
            capture_output=capture_output,
        )


@dataclass
class RuntimeLaunchResult:
    status: str
    runtime_details: dict[str, object]


class ContainerWorkerRuntime:
    def __init__(self, runner: CommandRunner | None = None, runtime: str | None = None) -> None:
        self.runner = runner or SubprocessRunner()
        self.runtime = runtime or settings.worker_runtime
        self.binary = self._detect_runtime_binary(self.runtime, allow_missing=runner is not None)
        Path(settings.worker_data_dir).mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _detect_runtime_binary(runtime: str, allow_missing: bool = False) -> str:
        for candidate in ([runtime] if runtime else []) + ["docker", "podman"]:
            if candidate and shutil.which(candidate):
                return candidate
        if allow_missing and runtime:
            return runtime
        raise RuntimeError("no container runtime found; expected docker or podman")

    @staticmethod
    def _reserve_local_port() -> int:
        sock = socket.socket()
        sock.bind(("127.0.0.1", 0))
        _, port = sock.getsockname()
        sock.close()
        return int(port)

    def _workload_name(self, workload_id: str) -> str:
        return f"boxty-{workload_id}"

    def launch(self, workload: dict) -> RuntimeLaunchResult:
        kind = workload["kind"]
        if kind == "function":
            return self._launch_function(workload)
        if kind == "sandbox":
            return self._launch_sandbox(workload)
        if kind in {"endpoint", "build"}:
            return self._launch_service(workload)
        raise RuntimeError(f"unsupported workload kind: {kind}")

    def _base_env_args(self, workload: dict) -> list[str]:
        args: list[str] = []
        for key, value in workload.get("env", {}).items():
            args.extend(["-e", f"{key}={value}"])
        return args

    def _launch_function(self, workload: dict) -> RuntimeLaunchResult:
        command = workload.get("command") or []
        if not command:
            command = ["python", "-c", "print('boxty function completed')"]
        result = self.runner.run(
            [self.binary, "run", "--rm", "--name", self._workload_name(workload["workload_id"])]
            + self._base_env_args(workload)
            + [workload["image"]]
            + command
        )
        return RuntimeLaunchResult(
            status="completed",
            runtime_details={
                "container_runtime": self.binary,
                "exit_code": result.returncode,
                "stdout": result.stdout,
            },
        )

    def _launch_sandbox(self, workload: dict) -> RuntimeLaunchResult:
        command = workload.get("command") or ["sleep", "infinity"]
        result = self.runner.run(
            [self.binary, "run", "-d", "--name", self._workload_name(workload["workload_id"])]
            + self._base_env_args(workload)
            + [workload["image"]]
            + command
        )
        container_id = result.stdout.strip()
        return RuntimeLaunchResult(
            status="running",
            runtime_details={
                "container_runtime": self.binary,
                "container_id": container_id,
                "attach_command": f"{self.binary} exec -it {container_id} /bin/sh",
                "ssh_mode": "sandbox_only",
            },
        )

    def _launch_service(self, workload: dict) -> RuntimeLaunchResult:
        command = workload.get("command") or ["sleep", "infinity"]
        host_port = self._reserve_local_port()
        container_port = int(workload.get("metadata", {}).get("container_port", 8000))
        result = self.runner.run(
            [self.binary, "run", "-d", "--name", self._workload_name(workload["workload_id"]), "-p", f"127.0.0.1:{host_port}:{container_port}"]
            + self._base_env_args(workload)
            + [workload["image"]]
            + command
        )
        container_id = result.stdout.strip()
        return RuntimeLaunchResult(
            status="running",
            runtime_details={
                "container_runtime": self.binary,
                "container_id": container_id,
                "host_port": host_port,
                "container_port": container_port,
                "origin_url": f"http://127.0.0.1:{host_port}",
            },
        )

    def stop(self, workload_id: str) -> None:
        name = self._workload_name(workload_id)
        self.runner.run([self.binary, "rm", "-f", name], capture_output=True)

    def inspect(self, workload_id: str) -> dict[str, object]:
        name = self._workload_name(workload_id)
        result = self.runner.run([self.binary, "inspect", name], capture_output=True)
        payload = json.loads(result.stdout)
        return payload[0] if payload else {}
