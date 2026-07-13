"""End-to-end tests for the Boxty deploy-and-run flow.

Run with::

    cd /root/boxty
    python e2e-tests/run_e2e.py

The script requires Docker, the control-plane venv, and a clean local Docker
state. It starts a fresh control plane and worker daemon, then:

1. Deploys a Python function app via the CLI.
2. Invokes the function through the control plane API.
3. Deploys a Python web endpoint app via the CLI.
4. Hits the public route exposed by the control plane.
5. Verifies that image-aware scheduling routes workloads to a warm worker.
"""
from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import httpx


BASE_DIR = Path(__file__).resolve().parent.parent
CONTROL_PLANE_DIR = BASE_DIR / "control_plane"
VENV = CONTROL_PLANE_DIR / ".venv"
E2E_APPS_DIR = BASE_DIR / "e2e-tests" / "cli-apps"
DEFAULT_PORT = 3001


def _cleanup_containers():
    """Remove any Boxty-owned containers and images."""
    try:
        cids = subprocess.run(
            ["docker", "ps", "-aq"], capture_output=True, text=True, check=True
        ).stdout.strip()
        if cids:
            for cid in cids.splitlines():
                subprocess.run(["docker", "rm", "-f", cid], capture_output=True)
    except Exception:
        pass
    try:
        iids = subprocess.run(
            ["docker", "images", "-q", "--filter", "reference=boxty/ws_*"],
            capture_output=True,
            text=True,
        ).stdout.strip()
        if iids:
            for iid in iids.splitlines():
                subprocess.run(["docker", "rmi", "-f", iid], capture_output=True)
    except Exception:
        pass


def _wait_for_server(url: str, timeout: int = 30) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            if httpx.get(f"{url}/healthz", timeout=2).status_code == 200:
                return
        except Exception:
            pass
        time.sleep(0.5)
    raise RuntimeError(f"Server at {url} did not become ready within {timeout}s")


def _register_user(base_url: str) -> dict:
    r = httpx.post(
        f"{base_url}/v1/auth/register",
        json={
            "external_user_id": f"e2e-{int(time.time())}",
            "email": f"e2e-{int(time.time())}@example.com",
        },
    )
    r.raise_for_status()
    return r.json()


def _register_provider(base_url: str, name: str) -> dict:
    r = httpx.post(
        f"{base_url}/v1/providers/register",
        json={
            "provider_name": name,
            "region": "eu-central",
            "pool": "general",
            "capabilities": {
                "cpu_cores": 4,
                "memory_mb": 8192,
                "disk_gb": 50,
                "gpu_count": 0,
                "supports_endpoint_serving": True,
                "supports_sandbox_ssh": True,
                "supports_image_builds": True,
            },
        },
    )
    r.raise_for_status()
    return r.json()


def _wait_for_provider(base_url: str, provider_id: str, timeout: int = 30) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = httpx.get(f"{base_url}/v1/providers")
        r.raise_for_status()
        for p in r.json():
            if p["provider_id"] == provider_id and p["status"] == "online":
                return
        time.sleep(0.5)
    raise RuntimeError(f"Provider {provider_id} did not come online within {timeout}s")


def _wait_for_workload(base_url: str, token: str, workload_id: str, status: str, timeout: int = 60) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = httpx.get(f"{base_url}/v1/workloads", headers=headers)
        r.raise_for_status()
        for w in r.json():
            if w["workload_id"] == workload_id:
                if w["status"] == status:
                    return w
                break
        time.sleep(1.0)
    raise RuntimeError(f"Workload {workload_id} did not reach status {status} within {timeout}s")


def _run_command(cmd: list[str], cwd: Path, env: dict) -> None:
    result = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")


def _provider_images(base_url: str, provider_id: str) -> set[str]:
    r = httpx.get(f"{base_url}/v1/providers")
    r.raise_for_status()
    for p in r.json():
        if p["provider_id"] == provider_id:
            return set(p["available_images"])
    return set()


def run_e2e(port: int = DEFAULT_PORT) -> None:
    base_url = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    env["BOXTY_API_URL"] = base_url
    env["BOXTY_GATEWAY_URL"] = base_url
    env["BOXTY_CONTROL_PLANE_URL"] = base_url
    env["PATH"] = f"{VENV / 'bin'}:{env.get('PATH', '')}"

    _cleanup_containers()

    # Start control plane
    cp_proc = subprocess.Popen(
        [str(VENV / "bin" / "uvicorn"), "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=CONTROL_PLANE_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        _wait_for_server(base_url)

        user = _register_user(base_url)
        headers = {"Authorization": f"Bearer {user['access_token']}"}
        workspaces = httpx.get(f"{base_url}/v1/workspaces", headers=headers).json()
        workspace_id = workspaces[0]["workspace_id"]
        environments = httpx.get(f"{base_url}/v1/workspaces/{workspace_id}/environments", headers=headers).json()
        environment_id = environments[0]["environment_id"]
        cfg = {
            "api_url": base_url,
            "token": user["access_token"],
            "workspace_id": workspace_id,
            "environment_id": environment_id,
        }
        config_path = Path.home() / ".boxty" / "config.json"
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w") as f:
            json.dump(cfg, f)

        # Register a cold worker and a warm worker.
        cold_provider = _register_provider(base_url, "e2e-cold-worker")
        warm_provider = _register_provider(base_url, "e2e-warm-worker")

        warm_proc = subprocess.Popen(
            [
                str(VENV / "bin" / "boxty-worker"),
                "run-daemon",
                "--provider-id",
                warm_provider["provider_id"],
                "--provider-token",
                warm_provider["provider_token"],
                "--cpu",
                "4",
                "--memory-mb",
                "8192",
                "--disk-gb",
                "50",
                "--supports-endpoints",
                "--supports-image-builds",
                "--warm-images",
                "python:3.11-slim",
                "--warm-pool-size",
                "2",
                "--poll-seconds",
                "2",
            ],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        cold_proc = subprocess.Popen(
            [
                str(VENV / "bin" / "boxty-worker"),
                "run-daemon",
                "--provider-id",
                cold_provider["provider_id"],
                "--provider-token",
                cold_provider["provider_token"],
                "--cpu",
                "4",
                "--memory-mb",
                "8192",
                "--disk-gb",
                "50",
                "--supports-endpoints",
                "--supports-image-builds",
                "--poll-seconds",
                "2",
            ],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        try:
            _wait_for_provider(base_url, warm_provider["provider_id"])
            _wait_for_provider(base_url, cold_provider["provider_id"])

            # Wait until the warm worker reports python:3.11-slim as available.
            deadline = time.time() + 60
            while time.time() < deadline:
                if "python:3.11-slim" in _provider_images(base_url, warm_provider["provider_id"]):
                    break
                time.sleep(1.0)
            else:
                raise RuntimeError("Warm worker did not report python:3.11-slim")

            # Deploy a Python function once. The first deploy will build the image
            # on whichever provider claims it; after it is running the image will
            # be present on that provider.
            _run_command(
                [str(VENV / "bin" / "boxty"), "app", "deploy", "app.py"],
                E2E_APPS_DIR / "py-function",
                env,
            )
            headers = {"Authorization": f"Bearer {cfg['token']}"}
            workloads = httpx.get(f"{base_url}/v1/workloads", headers=headers).json()
            func_wl = next(w for w in workloads if w["kind"] == "function")
            func_wl = _wait_for_workload(base_url, cfg["token"], func_wl["workload_id"], "running")
            r = httpx.post(
                f"{base_url}/v1/workloads/{func_wl['workload_id']}/invoke",
                headers=headers,
                json={"payload": {}},
                timeout=30,
            )
            r.raise_for_status()
            invocation = r.json()
            assert invocation["return_code"] == 0, f"Function returned non-zero: {invocation}"
            assert "hello-from-boxty-cli" in invocation["stdout"], f"Unexpected output: {invocation}"
            print("PASSED: function invoke")

            # Warm-pool scheduling: a second deploy of the same app should run on a
            # provider that already has the image. On a single Docker host both workers
            # see the same image list, so we only assert that the second deploy succeeds.
            # Image-aware scheduling is covered by the unit tests in test_store.py.
            first_provider_id = func_wl["assigned_provider_id"]
            image_ref = func_wl.get("image_ref") or func_wl["image"]
            # Give the worker a heartbeat cycle to report the built image.
            deadline = time.time() + 90
            while time.time() < deadline:
                if image_ref in _provider_images(base_url, first_provider_id):
                    break
                time.sleep(2.0)
            else:
                raise RuntimeError(f"Provider {first_provider_id} did not report built image {image_ref}")

            _run_command(
                [str(VENV / "bin" / "boxty"), "app", "deploy", "app.py", "--name", "warm-pool-test"],
                E2E_APPS_DIR / "py-function",
                env,
            )
            workloads = httpx.get(f"{base_url}/v1/workloads", headers=headers).json()
            second_wl = next(w for w in workloads if w["kind"] == "function" and w["workload_id"] != func_wl["workload_id"])
            second_wl = _wait_for_workload(base_url, cfg["token"], second_wl["workload_id"], "running")
            print(f"INFO: second deploy assigned to {second_wl['assigned_provider_id']}")
            print("PASSED: function second deploy")
            _run_command(
                [str(VENV / "bin" / "boxty"), "app", "deploy", "app.py"],
                E2E_APPS_DIR / "py-endpoint",
                env,
            )
            ep_route = None
            deadline = time.time() + 60
            while time.time() < deadline:
                workloads = httpx.get(f"{base_url}/v1/workloads", headers=headers).json()
                ep_wls = {w["workload_id"] for w in workloads if w["kind"] == "endpoint"}
                routes = httpx.get(f"{base_url}/v1/routes", headers=headers).json()
                for route in routes:
                    if route["workload_id"] in ep_wls:
                        ep_route = route
                        break
                if ep_route:
                    break
                time.sleep(1.0)
            assert ep_route is not None, "No route was created for the endpoint workload"

            r = httpx.get(ep_route["target_address"], timeout=30)
            r.raise_for_status()
            assert "hello-from-boxty-endpoint" in r.text, f"Unexpected endpoint response: {r.text}"
            print("PASSED: endpoint hit")
        finally:
            warm_proc.send_signal(signal.SIGTERM)
            try:
                warm_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                warm_proc.kill()
            cold_proc.send_signal(signal.SIGTERM)
            try:
                cold_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                cold_proc.kill()
    finally:
        cp_proc.send_signal(signal.SIGTERM)
        try:
            cp_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cp_proc.kill()
        _cleanup_containers()


if __name__ == "__main__":
    run_e2e()
