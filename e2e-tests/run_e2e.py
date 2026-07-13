"""End-to-end tests for the Boxty deploy-and-run flow.

Run with::

    cd /root/boxty
    python e2e-tests/run_e2e.py

The script requires Docker, the control-plane venv, and a clean local Docker
state. It starts a fresh control plane and worker daemon, then:

1. Runs auth flows (login, register, login-web device code).
2. Tests schedules (create + interval trigger).
3. Tests volumes (create + blob write/read/delete).
4. Tests secrets (create + list + delete).
5. Tests provider lifecycle (register/heartbeat/unregister + stale expiration).
6. Deploys a Python function app via the CLI.
7. Invokes the function through the control plane API.
8. Deploys a Python web endpoint app via the CLI.
9. Hits the public route exposed by the control plane.
10. Verifies that image-aware scheduling routes workloads to a warm worker.
"""
from __future__ import annotations

import json
import os
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any

import httpx


BASE_DIR = Path(__file__).resolve().parent.parent
CONTROL_PLANE_DIR = BASE_DIR / "control_plane"
VENV = CONTROL_PLANE_DIR / ".venv"
E2E_APPS_DIR = BASE_DIR / "e2e-tests" / "cli-apps"
DEFAULT_PORT = 3001

RESULTS: list[tuple[str, str]] = []


def _record(name: str, passed: bool) -> None:
    RESULTS.append((name, "PASSED" if passed else "FAILED"))
    print(f"{'PASSED' if passed else 'FAILED'}: {name}")


def _free_port() -> int:
    """Return a free ephemeral port on 127.0.0.1."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


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


def _cleanup_object_storage():
    """Remove local filesystem object storage used by volume blobs."""
    try:
        import shutil

        shutil.rmtree("/tmp/boxty-object-storage", ignore_errors=True)
    except Exception:
        pass


def _cleanup_local_config(tmp_home: str) -> None:
    """Remove isolated CLI config written during the test run."""
    try:
        import shutil

        shutil.rmtree(Path(tmp_home) / ".boxty", ignore_errors=True)
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


def _register_user(base_url: str, suffix: str | None = None) -> dict:
    suffix = suffix or str(int(time.time()))
    external_user_id = f"e2e-{suffix}"
    email = f"e2e-{suffix}@example.com"
    r = httpx.post(
        f"{base_url}/v1/auth/register",
        json={
            "external_user_id": external_user_id,
            "email": email,
        },
    )
    r.raise_for_status()
    data = r.json()
    data["external_user_id"] = external_user_id
    data["email"] = email
    return data


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


def _provider_heartbeat(base_url: str, provider_id: str, provider_token: str, status: str = "online") -> dict:
    r = httpx.post(
        f"{base_url}/v1/providers/{provider_id}/heartbeat",
        headers={"X-Provider-Id": provider_id, "Authorization": f"Bearer {provider_token}"},
        json={
            "available_slots": 4,
            "assigned_workloads": 0,
            "status": status,
            "available_cpu_cores": 4,
            "available_memory_mb": 8192,
            "available_disk_gb": 50,
            "available_gpu_count": 0,
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


def _run_command_output(cmd: list[str], cwd: Path | None, env: dict) -> str:
    result = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return result.stdout


def _provider_images(base_url: str, provider_id: str) -> set[str]:
    r = httpx.get(f"{base_url}/v1/providers")
    r.raise_for_status()
    for p in r.json():
        if p["provider_id"] == provider_id:
            return set(p["available_images"])
    return set()


# ---------------------------------------------------------------------------
# Auth flow tests
# ---------------------------------------------------------------------------


def _test_auth_register(base_url: str) -> dict:
    user = _register_user(base_url, suffix=str(int(time.time())))
    assert "access_token" in user, f"registration response missing token: {user}"
    assert user["access_token"].startswith("boxty_"), f"unexpected token format: {user}"
    r = httpx.get(f"{base_url}/v1/auth/me", headers={"Authorization": f"Bearer {user['access_token']}"})
    r.raise_for_status()
    me = r.json()
    assert me["external_user_id"] == user["external_user_id"], f"whoami mismatch: {me}"
    return user


def _test_auth_login(base_url: str, user: dict) -> dict:
    r = httpx.post(
        f"{base_url}/v1/auth/login",
        json={"external_user_id": user["external_user_id"], "email": user.get("email")},
    )
    r.raise_for_status()
    login = r.json()
    assert "access_token" in login, f"login response missing token: {login}"
    assert login["user_id"] == user["user_id"], f"login returned wrong user: {login}"
    return login


def _test_auth_login_web_device_code(base_url: str) -> dict:
    r = httpx.post(f"{base_url}/v1/auth/device", json={})
    r.raise_for_status()
    device = r.json()
    assert "device_code" in device and "user_code" in device, f"device_code response missing fields: {device}"

    # Authorize the device code as if the user approved it in the web UI.
    suffix = str(int(time.time() * 1e6))
    r = httpx.post(
        f"{base_url}/v1/auth/device/authorize",
        json={"user_code": device["user_code"], "external_user_id": f"e2e-web-{suffix}"},
    )
    r.raise_for_status()
    authz = r.json()
    assert authz["status"] == "authorized", f"authorize failed: {authz}"

    # Poll for the token (normally the CLI does this).
    deadline = time.time() + 30
    token_resp = None
    while time.time() < deadline:
        r = httpx.post(f"{base_url}/v1/auth/device/token", json={"device_code": device["device_code"]})
        r.raise_for_status()
        token_resp = r.json()
        if token_resp.get("status") == "authorized":
            break
        time.sleep(0.5)
    assert token_resp and token_resp.get("status") == "authorized", f"device token not authorized: {token_resp}"
    assert "access_token" in token_resp, f"device token missing access_token: {token_resp}"
    return token_resp


# ---------------------------------------------------------------------------
# Schedule tests
# ---------------------------------------------------------------------------


def _test_schedule_create_and_trigger(base_url: str, token: str, workspace_id: str, environment_id: str, owner_id: str) -> dict:
    # We need a function workload to attach the schedule to. Re-use the function workload path.
    # Create a simple workload image so schedule trigger can create a workload clone.
    r = httpx.post(
        f"{base_url}/v1/workloads",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "owner_id": owner_id,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "kind": "function",
            "image": "python:3.11-slim",
            "command": ["python", "-c", "print('scheduled')"],
            "region": "eu-central",
            "pool": "general",
            "resources": {"cpu_cores": 1, "memory_mb": 512, "disk_gb": 2, "gpu_count": 0},
        },
    )
    r.raise_for_status()
    workload = r.json()

    schedule_name = f"e2e-schedule-{int(time.time())}"
    r = httpx.post(
        f"{base_url}/v1/schedules",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": schedule_name,
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "owner_id": owner_id,
            "workload_id": workload["workload_id"],
            "interval_seconds": 1,
        },
    )
    r.raise_for_status()
    schedule = r.json()
    assert schedule["name"] == schedule_name, f"schedule name mismatch: {schedule}"
    assert schedule["interval_seconds"] == 1, f"schedule interval mismatch: {schedule}"

    # Manual trigger to verify trigger path works.
    r = httpx.post(f"{base_url}/v1/schedules/{schedule['schedule_id']}/trigger", headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    triggered = r.json()
    assert triggered.get("schedule", {}).get("schedule_id") == schedule["schedule_id"], f"trigger returned wrong schedule: {triggered}"

    # Wait for the scheduler to fire the interval at least once.
    deadline = time.time() + 60
    seen_extra = False
    related: list[dict] = []
    while time.time() < deadline:
        r = httpx.get(f"{base_url}/v1/workloads", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        related = [w for w in r.json() if w.get("metadata", {}).get("triggered_by_schedule") == schedule["schedule_id"]]
        if len(related) >= 2:
            seen_extra = True
            break
        time.sleep(1.0)
    assert seen_extra, f"interval schedule did not create additional workload within 60s; found {len(related)}"

    r = httpx.delete(f"{base_url}/v1/schedules/{schedule['schedule_id']}", headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    return schedule


# ---------------------------------------------------------------------------
# Volume tests
# ---------------------------------------------------------------------------


def _test_volume_blob_lifecycle(base_url: str, token: str, workspace_id: str) -> dict:
    volume_name = f"e2e-volume-{int(time.time())}"
    r = httpx.post(
        f"{base_url}/v1/volumes",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "name": volume_name, "size_gb": 1, "volume_type": "object-storage"},
    )
    r.raise_for_status()
    volume = r.json()
    assert volume["workspace_id"] == workspace_id, f"volume workspace mismatch: {volume}"

    locator = volume["volume_id"]
    blob_path = "hello.txt"
    blob_data = b"hello from e2e volume blob"

    # Create the blob by doing a PUT with raw body data (the API reads request.body()).
    r = httpx.put(
        f"{base_url}/v1/volumes/{locator}/blob",
        params={"path": blob_path},
        content=blob_data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/octet-stream"},
    )
    if r.status_code != 200:
        raise RuntimeError(f"PUT volume blob failed {r.status_code}: {r.text}")
    entry = r.json()
    assert entry["path"] == blob_path, f"blob entry path mismatch: {entry}"

    # Read back with a short retry; filesystem storage may be asynchronous.
    deadline = time.time() + 5
    body = b""
    while time.time() < deadline:
        r = httpx.get(
            f"{base_url}/v1/volumes/{locator}/blob",
            params={"path": blob_path},
            headers={"Authorization": f"Bearer {token}"},
        )
        if r.status_code == 200:
            body = r.content
            break
        time.sleep(0.5)
    assert body == blob_data, f"blob read mismatch: {body!r} != {blob_data!r}"

    r = httpx.delete(
        f"{base_url}/v1/volumes/{locator}/blob",
        params={"path": blob_path},
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    deleted = r.json()
    assert deleted.get("deleted") is True, f"blob delete failed: {deleted}"

    r = httpx.get(
        f"{base_url}/v1/volumes/{locator}/blob",
        params={"path": blob_path},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404, f"deleted blob should be 404: {r.status_code}"

    r = httpx.delete(
        f"{base_url}/v1/volumes/{workspace_id}/{locator}",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    deleted = r.json()
    assert deleted.get("deleted") is True, f"volume delete failed: {deleted}"
    return volume


# ---------------------------------------------------------------------------
# Secret tests
# ---------------------------------------------------------------------------


def _test_secret_lifecycle(base_url: str, token: str, workspace_id: str) -> dict:
    secret_name = f"e2e-secret-{int(time.time())}"
    r = httpx.post(
        f"{base_url}/v1/secrets",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "name": secret_name, "env_vars": {"API_KEY": "super-secret"}},
    )
    r.raise_for_status()
    secret = r.json()
    assert secret["name"] == secret_name, f"secret name mismatch: {secret}"

    r = httpx.get(f"{base_url}/v1/secrets", params={"workspace_id": workspace_id}, headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    listed = r.json()
    assert any(s["name"] == secret_name for s in listed), f"secret {secret_name} not found in list: {listed}"

    r = httpx.delete(
        f"{base_url}/v1/secrets/{workspace_id}/{secret_name}",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    deleted = r.json()
    assert deleted.get("deleted") is True, f"secret delete failed: {deleted}"
    return secret


# ---------------------------------------------------------------------------
# Provider lifecycle tests
# ---------------------------------------------------------------------------


def _test_provider_lifecycle(base_url: str) -> dict:
    provider = _register_provider(base_url, f"e2e-lifecycle-{int(time.time())}")
    provider_id = provider["provider_id"]
    provider_token = provider["provider_token"]

    _wait_for_provider(base_url, provider_id)

    # Heartbeat with a different status and verify it is reflected.
    _provider_heartbeat(base_url, provider_id, provider_token, status="draining")
    time.sleep(1)
    r = httpx.get(f"{base_url}/v1/providers")
    r.raise_for_status()
    p = next((p for p in r.json() if p["provider_id"] == provider_id), None)
    assert p is not None, "provider disappeared after heartbeat"
    assert p["status"] == "draining", f"heartbeat status not reflected: {p}"

    # Unregister and verify removal.
    r = httpx.delete(
        f"{base_url}/v1/providers/{provider_id}",
        headers={"X-Provider-Id": provider_id, "Authorization": f"Bearer {provider_token}"},
    )
    r.raise_for_status()
    unreg = r.json()
    assert unreg.get("unregistered") is True, f"unregister failed: {unreg}"

    r = httpx.get(f"{base_url}/v1/providers")
    r.raise_for_status()
    assert not any(p["provider_id"] == provider_id for p in r.json()), "provider still listed after unregister"
    return provider


def _test_provider_stale_expiration(base_url: str, cp_proc: subprocess.Popen, env: dict, port: int) -> subprocess.Popen:
    # Run stale expiration against a *separate* control plane so the short TTL
    # does not interfere with the provider used by the rest of the E2E flow.
    stale_port = _free_port()
    stale_base_url = f"http://127.0.0.1:{stale_port}"
    stale_env = env.copy()
    stale_env["BOXTY_PROVIDER_HEARTBEAT_TTL_SECONDS"] = "2"
    stale_cp = subprocess.Popen(
        [str(VENV / "bin" / "uvicorn"), "app.main:app", "--host", "127.0.0.1", "--port", str(stale_port)],
        cwd=CONTROL_PLANE_DIR,
        env=stale_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        _wait_for_server(stale_base_url, timeout=30)
        provider = _register_provider(stale_base_url, f"e2e-stale-{int(time.time())}")
        provider_id = provider["provider_id"]
        provider_token = provider["provider_token"]
        _wait_for_provider(stale_base_url, provider_id)
        _provider_heartbeat(stale_base_url, provider_id, provider_token, status="online")
        time.sleep(0.5)
        deadline = time.time() + 30
        stale_seen = False
        p = None
        while time.time() < deadline:
            r = httpx.get(f"{stale_base_url}/v1/providers")
            r.raise_for_status()
            p = next((p for p in r.json() if p["provider_id"] == provider_id), None)
            if p is None or p["status"] == "offline":
                stale_seen = True
                break
            time.sleep(1.0)
        assert stale_seen, f"provider not marked offline after stale TTL: {p}"
    finally:
        try:
            stale_cp.send_signal(signal.SIGTERM)
            stale_cp.wait(timeout=5)
        except Exception:
            stale_cp.kill()
    return cp_proc


# ---------------------------------------------------------------------------
# Deploy flow helpers
# ---------------------------------------------------------------------------


def _configure_cli_for_user(tmp_home: str, base_url: str, token: str, user: dict) -> dict:
    """Write a CLI config into a temp HOME that points to the E2E server and user."""
    config_path = Path(tmp_home) / ".boxty" / "config.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    cfg = {
        "api_url": base_url,
        "token": token,
        "user_id": user["user_id"],
        "workspace_id": user["default_workspace_id"],
        "environment_id": user.get("default_environment_id"),
    }
    with open(config_path, "w") as f:
        json.dump(cfg, f)
    return {"HOME": tmp_home, "PATH": os.environ.get("PATH", ""), "BOXTY_API_URL": base_url, "BOXTY_TOKEN": token}


def _deploy_function(cli_env: dict, workspace_id: str, environment_id: str) -> str:
    app_path = E2E_APPS_DIR / "py-function" / "app.py"
    _run_command(
        [
            str(VENV / "bin" / "boxty"),
            "app",
            "deploy",
            str(app_path),
            "--workspace",
            workspace_id,
            "--environment",
            environment_id,
        ],
        cwd=BASE_DIR,
        env=cli_env,
    )
    # Extract the deployed workload id from the app list. The function is the
    # workload whose metadata contains this app name and function name.
    output = _run_command_output(
        [str(VENV / "bin" / "boxty"), "app", "list", "--workspace", workspace_id, "--environment", environment_id, "--json"],
        cwd=BASE_DIR,
        env=cli_env,
    )
    workloads = json.loads(output)
    func = next(
        (w for w in workloads if w.get("metadata", {}).get("function_name") == "hello" and w.get("metadata", {}).get("app") == "py-function-test"),
        None,
    )
    if func is None:
        raise RuntimeError(f"function workload not found in app list: {workloads}")
    return func["workload_id"]


def _deploy_endpoint(cli_env: dict, workspace_id: str, environment_id: str) -> str:
    app_path = E2E_APPS_DIR / "py-endpoint" / "app.py"
    _run_command(
        [
            str(VENV / "bin" / "boxty"),
            "app",
            "deploy",
            str(app_path),
            "--workspace",
            workspace_id,
            "--environment",
            environment_id,
        ],
        cwd=BASE_DIR,
        env=cli_env,
    )
    output = _run_command_output(
        [str(VENV / "bin" / "boxty"), "app", "list", "--workspace", workspace_id, "--environment", environment_id, "--json"],
        cwd=BASE_DIR,
        env=cli_env,
    )
    workloads = json.loads(output)
    ep = next(
        (w for w in workloads if w.get("metadata", {}).get("endpoint_name") == "hello" and w.get("metadata", {}).get("app") == "py-endpoint-test"),
        None,
    )
    if ep is None:
        raise RuntimeError(f"endpoint workload not found in app list: {workloads}")
    return ep["workload_id"]


# ---------------------------------------------------------------------------
# Main entrypoint
# ---------------------------------------------------------------------------


def run_e2e() -> None:
    port = _free_port()
    base_url = f"http://127.0.0.1:{port}"
    env = os.environ.copy()
    # Make sure the CLI looks at the E2E server even if the user has a local config.
    env["BOXTY_API_URL"] = base_url
    env["BOXTY_GATEWAY_URL"] = base_url
    env["BOXTY_CONTROL_PLANE_URL"] = base_url
    env["BOXTY_OBJECT_STORAGE_PROVIDER"] = "filesystem"
    env["BOXTY_SECRET_ENCRYPTION_KEY"] = "e2e-secret-encryption-key-32bytes!!"
    env["BOXTY_PROVIDER_HEARTBEAT_TTL_SECONDS"] = "90"
    # Disable RunPod fallback so workloads stay assigned to the local worker.
    env["BOXTY_RUNPOD_ENABLED"] = "false"
    env["BOXTY_WORKER_DATA_DIR"] = "/tmp/boxty-worker-e2e"
    env["PYTHONUNBUFFERED"] = "1"

    _cleanup_containers()
    _cleanup_object_storage()

    # Start a fresh control plane
    cp_proc = subprocess.Popen(
        [str(VENV / "bin" / "uvicorn"), "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=CONTROL_PLANE_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        _wait_for_server(base_url, timeout=30)
    except Exception:
        cp_proc.kill()
        raise

    try:
        # 1. Auth flows
        try:
            user = _test_auth_register(base_url)
            _record("auth register", True)
        except Exception as exc:
            _record("auth register", False)
            print(f"FAILED: auth register - {exc}")
            raise

        try:
            _test_auth_login(base_url, user)
            _record("auth login", True)
        except Exception as exc:
            _record("auth login", False)
            print(f"FAILED: auth login - {exc}")

        try:
            _test_auth_login_web_device_code(base_url)
            _record("auth login-web device code", True)
        except Exception as exc:
            _record("auth login-web device code", False)
            print(f"FAILED: auth login-web device code - {exc}")

        token = user["access_token"]
        workspace_id = user["default_workspace_id"]
        environment_id = user.get("default_environment_id")
        assert environment_id is not None, "user registration did not include a default environment id"
        owner_id = user["user_id"]

        # Stand up a provider early; schedules and deploy flows need a backend.
        shared_provider = _register_provider(base_url, "e2e-shared")
        shared_provider_id = shared_provider["provider_id"]
        shared_provider_token = shared_provider["provider_token"]
        provider_stop = threading.Event()

        def _heartbeat_loop():
            while not provider_stop.is_set():
                try:
                    _provider_heartbeat(base_url, shared_provider_id, shared_provider_token)
                except Exception:
                    pass
                provider_stop.wait(timeout=5)

        heartbeat_thread = threading.Thread(target=_heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        _wait_for_provider(base_url, shared_provider_id)

        # 2. Schedules
        try:
            _test_schedule_create_and_trigger(base_url, token, workspace_id, environment_id, owner_id)
            _record("schedule create + interval trigger", True)
        except Exception as exc:
            _record("schedule create + interval trigger", False)
            print(f"FAILED: schedule create + interval trigger - {exc}")

        # 3. Volumes
        try:
            _test_volume_blob_lifecycle(base_url, token, workspace_id)
            _record("volume blob lifecycle", True)
        except Exception as exc:
            _record("volume blob lifecycle", False)
            print(f"FAILED: volume blob lifecycle - {exc}")

        # 4. Secrets
        try:
            _test_secret_lifecycle(base_url, token, workspace_id)
            _record("secret lifecycle", True)
        except Exception as exc:
            _record("secret lifecycle", False)
            print(f"FAILED: secret lifecycle - {exc}")

        # 5. Provider lifecycle
        # Stop the shared provider heartbeat and let it go stale so the only
        # online provider during the deploy phase is the worker daemon.
        provider_stop.set()

        try:
            _test_provider_lifecycle(base_url)
            _record("provider lifecycle", True)
        except Exception as exc:
            _record("provider lifecycle", False)
            print(f"FAILED: provider lifecycle - {exc}")

        try:
            _test_provider_stale_expiration(base_url, cp_proc, env, port)
            _record("provider stale expiration", True)
        except Exception as exc:
            _record("provider stale expiration", False)
            print(f"FAILED: provider stale expiration - {exc}")

        # 6. Deploy function/endpoint via CLI, invoke, and assert image scheduling
        tmp_home = tempfile.mkdtemp(prefix="boxty-e2e-home-")
        try:
            cli_env = _configure_cli_for_user(tmp_home, base_url, token, user)

            # Start a worker daemon so scheduling and image building actually run.
            worker_info = _register_provider(base_url, "e2e-worker")
            worker_id = worker_info["provider_id"]
            worker_token = worker_info["provider_token"]
            worker_log_path = Path(tempfile.gettempdir()) / f"boxty-worker-{worker_id}.log"
            worker_log = open(worker_log_path, "w")
            worker_proc = subprocess.Popen(
                [
                    str(VENV / "bin" / "boxty-worker"),
                    "run-daemon",
                    "--provider-id",
                    worker_id,
                    "--provider-token",
                    worker_token,
                    "--supports-endpoints",
                    "--supports-image-builds",
                    "--auto-detect-resources",
                    "--poll-seconds",
                    "2",
                ],
                cwd=BASE_DIR,
                env=env,
                stdout=worker_log,
                stderr=subprocess.STDOUT,
                text=True,
            )
            try:
                _wait_for_provider(base_url, worker_id)

                # Deploy the function app
                try:
                    func_wl_id = _deploy_function(cli_env, workspace_id, environment_id)
                    _record("deploy function", True)
                except Exception as exc:
                    _record("deploy function", False)
                    print(f"FAILED: deploy function - {exc}")
                    raise

                # Wait for it to reach running so the scheduler assigns a worker
                try:
                    func_wl = _wait_for_workload(base_url, token, func_wl_id, "running")
                    _record("function running", True)
                except Exception as exc:
                    _record("function running", False)
                    print(f"FAILED: function running - {exc}")
                    raise

                # Invoke the function via the control plane API
                try:
                    r = httpx.post(
                        f"{base_url}/v1/workloads/{func_wl_id}/invoke",
                        headers={"Authorization": f"Bearer {token}"},
                        json={"payload": {}},
                    )
                    r.raise_for_status()
                    inv = r.json()
                    result_value = inv.get("result")
                    stdout_value = inv.get("stdout", "")
                    assert (
                        result_value == "hello-from-boxty-cli" or '"hello-from-boxty-cli"' in stdout_value
                    ), f"unexpected invoke result: {inv}"
                    _record("invoke function", True)
                except Exception as exc:
                    _record("invoke function", False)
                    print(f"FAILED: invoke function - {exc}")
                    raise

                # Deploy the endpoint app
                try:
                    ep_wl_id = _deploy_endpoint(cli_env, workspace_id, environment_id)
                    _record("deploy endpoint", True)
                except Exception as exc:
                    _record("deploy endpoint", False)
                    print(f"FAILED: deploy endpoint - {exc}")
                    raise

                # Wait for the endpoint to reach running
                try:
                    ep_wl = _wait_for_workload(base_url, token, ep_wl_id, "running")
                    _record("endpoint running", True)
                except Exception as exc:
                    _record("endpoint running", False)
                    print(f"FAILED: endpoint running - {exc}")
                    raise

                # Hit the published route
                try:
                    route_url = ep_wl["runtime_details"]["origin_url"] + "/hello"
                    r = httpx.get(route_url, timeout=10)
                    r.raise_for_status()
                    assert r.text == "hello-from-boxty-endpoint", f"unexpected endpoint response: {r.text}"
                    _record("endpoint route", True)
                except Exception as exc:
                    _record("endpoint route", False)
                    print(f"FAILED: endpoint route - {exc}")
                    raise

                # Verify that the worker reported the image as available.
                try:
                    images = _provider_images(base_url, worker_id)
                    image_ref = func_wl["image_ref"]
                    assert image_ref in images, f"worker did not warm {image_ref}; available={images}"
                    _record("image-aware scheduling", True)
                except Exception as exc:
                    _record("image-aware scheduling", False)
                    print(f"FAILED: image-aware scheduling - {exc}")
                    raise

            finally:
                try:
                    worker_proc.send_signal(signal.SIGTERM)
                    worker_proc.wait(timeout=5)
                except Exception:
                    worker_proc.kill()

        finally:
            _cleanup_local_config(tmp_home)

    finally:
        try:
            cp_proc.send_signal(signal.SIGTERM)
            cp_proc.wait(timeout=5)
        except Exception:
            cp_proc.kill()

    # Print a summary table
    print("\n=== E2E results ===")
    for name, result in RESULTS:
        print(f"{result}: {name}")
    if any(result == "FAILED" for _, result in RESULTS):
        sys.exit(1)


if __name__ == "__main__":
    run_e2e()
