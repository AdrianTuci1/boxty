from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app.config import settings
from app.main import app
from app.models import (
    ProviderCapabilities,
    ProviderHeartbeatRequest,
    ProviderRegistrationRequest,
    WorkloadCreateRequest,
    WorkloadKind,
    WorkloadStatus,
)
from app.store import InMemoryStore


class TunnelTests(unittest.TestCase):
    def setUp(self) -> None:
        object.__setattr__(settings, "secret_encryption_key", "test-secret-key")
        object.__setattr__(settings, "provider_shared_token", "")
        self.store = InMemoryStore()
        self.user, self.account, self.workspace, self.environment = self.store.register_user(
            user_id="usr_test",
            external_user_id="adrian",
            email="adrian@example.com",
        )
        self.provider = self.store.register_provider(
            ProviderRegistrationRequest(
                provider_name="provider-1",
                region="eu-central",
                pool="general",
                capabilities=ProviderCapabilities(
                    cpu_cores=16,
                    memory_mb=32768,
                    disk_gb=500,
                    supports_endpoint_serving=True,
                    supports_sandbox_ssh=True,
                    supports_image_builds=True,
                ),
            )
        )
        self.store.heartbeat_provider(
            self.provider.provider_id,
            ProviderHeartbeatRequest(available_slots=4, running_workloads=0),
        )

        import app.main as main_module
        main_module.store = self.store
        main_module.active_tunnels.clear()
        main_module.pending_responses.clear()

        self.client = TestClient(app)

    def test_proxy_returns_404_when_endpoint_not_found(self) -> None:
        response = self.client.get("/r/nonexistent-api")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_proxy_returns_503_when_provider_not_connected(self) -> None:
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind=WorkloadKind.endpoint,
                image="ghcr.io/acme/api:latest",
                endpoint_name="test-api",
            )
        )
        workload.status = WorkloadStatus.running
        self.store.workloads[workload.workload_id] = workload

        response = self.client.get("/r/test-api")
        self.assertEqual(response.status_code, 503)
        # Provider may be missing or not connected.
        self.assertIn(
            response.json()["detail"].lower(),
            {"provider not connected", "endpoint not assigned to a provider"},
        )

    def test_tunnel_accepts_valid_token(self) -> None:
        with self.client.websocket_connect(
            f"/v1/providers/{self.provider.provider_id}/tunnel?token={self.provider.provider_token}"
        ) as ws:
            ws.close()

    def test_tunnel_rejects_invalid_token(self) -> None:
        with self.assertRaises(Exception):
            with self.client.websocket_connect(
                f"/v1/providers/{self.provider.provider_id}/tunnel?token=invalid"
            ) as ws:
                ws.close()

if __name__ == "__main__":
    unittest.main()
