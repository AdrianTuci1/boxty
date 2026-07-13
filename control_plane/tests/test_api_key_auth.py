"""Tests for API key authentication.

API keys are intended for servers and automation running on a VPS.
They authenticate with ``Authorization: Bearer bx_...`` and are scoped to
a single workspace and environment.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.store import store
from app.models import ApiKeyCreateRequest


client = TestClient(app)


def _bootstrap_user() -> tuple[dict, str]:
    r = client.post("/v1/auth/register", json={
        "external_user_id": "apikey-test-user",
        "email": "apikey@example.com",
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return data, data["access_token"]


def test_api_key_can_create_workload():
    user, token = _bootstrap_user()
    workspace_id = user["default_workspace_id"]
    environment_id = user["default_environment_id"]

    # Create an API key via the authenticated user endpoint
    r = client.post(
        "/v1/api-keys",
        json={
            "owner_id": user["user_id"],
            "workspace_id": workspace_id,
            "environment_id": environment_id,
            "name": "server-key",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    api_key = r.json()
    api_key_secret = api_key["token_value"]
    assert api_key_secret.startswith("bx_")

    # Use the API key to list workloads (should be empty, but auth must pass)
    r = client.get(
        "/v1/workloads",
        headers={"Authorization": f"Bearer {api_key_secret}"},
    )
    assert r.status_code == 200, r.text
    assert r.json() == []

    # Create a workload without specifying workspace/env; API key scope fills them
    r = client.post(
        "/v1/workloads",
        json={
            "kind": "function",
            "image": "python:3.11-slim",
            "command": ["python", "-c", "print('hello')"],
        },
        headers={"Authorization": f"Bearer {api_key_secret}"},
    )
    assert r.status_code == 200, r.text
    workload = r.json()
    assert workload["owner_id"] == user["user_id"]
    assert workload["workspace_id"] == workspace_id
    assert workload["environment_id"] == environment_id

    # Listing workloads now returns the created workload
    r = client.get(
        "/v1/workloads",
        headers={"Authorization": f"Bearer {api_key_secret}"},
    )
    assert r.status_code == 200, r.text
    assert len(r.json()) == 1
    assert r.json()[0]["workload_id"] == workload["workload_id"]

    # ``/auth/me`` also resolves the API key to the owner
    r = client.get(
        "/v1/auth/me",
        headers={"Authorization": f"Bearer {api_key_secret}"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["user_id"] == user["user_id"]


def test_api_key_scopes_cannot_access_other_workspaces():
    user1, token1 = _bootstrap_user()
    user2, token2 = _bootstrap_user()

    r = client.post(
        "/v1/api-keys",
        json={
            "owner_id": user1["user_id"],
            "workspace_id": user1["default_workspace_id"],
            "environment_id": user1["default_environment_id"],
            "name": "scoped-key",
        },
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert r.status_code == 200, r.text
    secret = r.json()["token_value"]

    # API key holder cannot list the other user's workspace environments
    r = client.get(
        f"/v1/workspaces/{user2['default_workspace_id']}/environments",
        headers={"Authorization": f"Bearer {secret}"},
    )
    assert r.status_code == 403, r.text


def test_invalid_api_key_is_rejected():
    r = client.get(
        "/v1/workloads",
        headers={"Authorization": "Bearer bx_invalidtoken"},
    )
    assert r.status_code == 401, r.text


def test_api_key_scheme_is_supported():
    user, token = _bootstrap_user()
    r = client.post(
        "/v1/api-keys",
        json={
            "owner_id": user["user_id"],
            "workspace_id": user["default_workspace_id"],
            "environment_id": user["default_environment_id"],
            "name": "scheme-key",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    secret = r.json()["token_value"]

    r = client.get(
        "/v1/workloads",
        headers={"Authorization": f"ApiKey {secret}"},
    )
    assert r.status_code == 200, r.text
