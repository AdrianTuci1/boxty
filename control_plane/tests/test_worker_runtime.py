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
        self._image_present: set[str] = set()

    def run(self, args: list[str], *, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
        self.calls.append(args)
        if "images" in args:
            # Return a list containing whatever images have been pulled or committed.
            return subprocess.CompletedProcess(
                args=args,
                returncode=0,
                stdout="\n".join(self._image_present) + "\n",
                stderr="",
            )
        if "inspect" in args:
            image = args[-1]
            if image in self._image_present:
                return subprocess.CompletedProcess(args=args, returncode=0, stdout=json.dumps([{"Id": "inspect-1"}]), stderr="")
            return subprocess.CompletedProcess(args=args, returncode=1, stdout="", stderr="not found")
        if "pull" in args:
            self._image_present.add(args[-1])
            return subprocess.CompletedProcess(args=args, returncode=0, stdout="", stderr="")
        if "run" in args and "-d" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout="container-123\n", stderr="")
        if "commit" in args:
            # Fake a committed warm image tag.
            tag = args[-1]
            self._image_present.add(tag)
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=f"committed-{tag}\n", stderr="")
        if "rename" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout="", stderr="")
        if "rm" in args:
            return subprocess.CompletedProcess(args=args, returncode=0, stdout="", stderr="")
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="function output\n", stderr="")


class WorkerRuntimeTests(unittest.TestCase):
    def test_launch_sandbox_uses_detached_container(self) -> None:
        runner = FakeRunner()
        runner._image_present.add("ubuntu:22.04")
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
        # The runtime first inspects the image, then runs a detached container.
        run_calls = [c for c in runner.calls if "run" in c and "-d" in c]
        self.assertTrue(run_calls)

    def test_launch_function_runs_server(self) -> None:
        runner = FakeRunner()
        runner._image_present.add("python:3.11")
        runtime = ContainerWorkerRuntime(runner=runner, runtime="docker")
        # FakeRunner cannot run a real HTTP server, so skip the health probe.
        runtime._wait_for_health = lambda origin_url, timeout=30: True
        result = runtime.launch(
            {
                "workload_id": "wl_2",
                "kind": "function",
                "image": "python:3.11",
                "command": ["python", "-c", "print('ok')"],
                "env": {},
            }
        )
        # Function workloads run as a long-lived server container. The scheduler
        # invokes them later via the runtime origin_url.
        self.assertEqual(result.status, "running")
        self.assertEqual(result.runtime_details["container_id"], "container-123")
        self.assertTrue(result.runtime_details.get("origin_url", "").startswith("http://127.0.0.1:"))


if __name__ == "__main__":
    unittest.main()
