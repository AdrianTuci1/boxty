from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.worker_runtime import ContainerWorkerRuntime


class FakeRunner:
    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
        self.calls.append(args)
        if "inspect" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=json.dumps([{"Id": "inspect-1"}]), stderr="")
        if "run" in args and "-d" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout="container-123\n", stderr="")
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="function output\n", stderr="")


class WorkerRuntimeTests(unittest.TestCase):
    def test_launch_sandbox_uses_detached_container(self) -> None:
        runner = FakeRunner()
        runtime = ContainerWorkerRuntime(runner=runner, runtime="docker")
        result = runtime.launch(
            {
                "workload_id": "wl_1",
                "kind": "sandbox",
                "image": "ubuntu:22.04",
                "command": [],
                "env": {},
            }
        )
        self.assertEqual(result.status, "running")
        self.assertEqual(result.runtime_details["container_id"], "container-123")
        self.assertIn("-d", runner.calls[0])

    def test_launch_function_completes(self) -> None:
        runner = FakeRunner()
        runtime = ContainerWorkerRuntime(runner=runner, runtime="docker")
        result = runtime.launch(
            {
                "workload_id": "wl_2",
                "kind": "function",
                "image": "python:3.11",
                "command": ["python", "-c", "print('ok')"],
                "env": {},
            }
        )
        self.assertEqual(result.status, "completed")
        self.assertIn("stdout", result.runtime_details)


if __name__ == "__main__":
    unittest.main()
