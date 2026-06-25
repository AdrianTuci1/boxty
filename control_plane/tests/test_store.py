from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import settings
from app.models import (
    ApiKeyCreateRequest,
    InviteCreateRequest,
    ProviderCapabilities,
    ProviderHeartbeatRequest,
    ProviderRegistrationRequest,
    RoutePublishRequest,
    SandboxSessionRequest,
    SecretCreateRequest,
    UsageMeterRequest,
    VolumeCreateRequest,
    WorkloadCreateRequest,
)
from app.store import InMemoryStore


class ControlPlaneStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        object.__setattr__(settings, "secret_encryption_key", "test-secret-key")
        self.store = InMemoryStore()
        self.user, self.account, self.workspace, self.environment = self.store.register_user(
            user_id="usr_test",
            external_user_id="adrian",
            email="adrian@example.com",
        )

    def _register_provider(self) -> tuple[str, str]:
        provider = self.store.register_provider(
            ProviderRegistrationRequest(
                provider_name="provider-1",
                region="eu-central",
                pool="general",
                public_base_url="https://provider-1.example.com",
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
        self.assertTrue(self.store.verify_provider_token(provider.provider_id, provider.provider_token))
        self.store.heartbeat_provider(
            provider.provider_id,
            ProviderHeartbeatRequest(
                available_slots=4,
                running_workloads=0,
            ),
        )
        return provider.provider_id, provider.provider_token

    def test_signup_bootstraps_credit(self) -> None:
        self.assertEqual(self.account.balance_usd, settings.bootstrap_credit_usd)
        self.assertEqual(self.account.credit_grants_usd, settings.bootstrap_credit_usd)
        self.assertTrue(self.workspace.is_default)
        self.assertEqual(self.workspace.name, "adrian")
        self.assertTrue(self.environment.is_default)
        self.assertEqual(self.environment.name, "main")

    def test_default_workspace_and_environment_cannot_be_deleted(self) -> None:
        with self.assertRaisesRegex(ValueError, "default workspace"):
            self.store.delete_workspace(self.workspace.workspace_id)
        with self.assertRaisesRegex(ValueError, "default environment"):
            self.store.delete_environment(self.environment.environment_id)

    def test_create_api_key_and_invite(self) -> None:
        api_key = self.store.create_api_key(
            ApiKeyCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                name="ci-key",
            )
        )
        invite = self.store.create_invite(
            InviteCreateRequest(
                inviter_user_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                email="teammate@example.com",
            )
        )
        self.assertTrue(api_key.secret_token.startswith("bx_"))
        self.assertEqual(invite.email, "teammate@example.com")

    def test_secret_is_resolved_only_in_launch_spec(self) -> None:
        self._register_provider()
        self.store.create_secret(
            SecretCreateRequest(
                workspace_id=self.workspace.workspace_id,
                name="openai",
                env_vars={"OPENAI_API_KEY": "sk-test"},
            )
        )
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
                env={"MODE": "dev"},
                secret_names=["openai"],
            )
        )
        self.assertEqual(workload.secret_names, ["openai"])
        self.assertEqual(workload.env, {"MODE": "dev"})
        launch_spec = self.store.workload_launch_spec(workload.workload_id)
        self.assertEqual(launch_spec.env["MODE"], "dev")
        self.assertEqual(launch_spec.env["OPENAI_API_KEY"], "sk-test")

    def test_single_table_export_contains_workspace_entities(self) -> None:
        items = self.store.export_single_table_items()
        entity_types = {item.entity_type for item in items}
        self.assertIn("User", entity_types)
        self.assertIn("Account", entity_types)
        self.assertIn("Workspace", entity_types)
        self.assertIn("Environment", entity_types)

    def test_sandbox_session_allowed_only_for_sandbox(self) -> None:
        self._register_provider()
        function = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="function",
                image="python:3.11",
            )
        )
        with self.assertRaisesRegex(ValueError, "sandbox workloads"):
            self.store.create_sandbox_session(
                SandboxSessionRequest(
                    workload_id=function.workload_id,
                    requester_id="usr_test",
                )
            )

    def test_cpu_ram_gpu_usage_is_charged(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
                resources={
                    "cpu_cores": 2,
                    "memory_mb": 4096,
                    "disk_gb": 10,
                    "gpu_count": 1,
                    "gpu_type": "A100",
                },
            )
        )
        response = self.store.meter_usage(
            UsageMeterRequest(
                workload_id=workload.workload_id,
                cpu_seconds=7200,
                ram_gb_seconds=14400,
                gpu_seconds=3600,
                storage_gb_seconds=36000,
            )
        )
        expected = round(
            2 * settings.cpu_price_per_vcpu_hour_usd / 1  # already expressed by raw cpu_seconds aggregation
            + 4 * settings.ram_price_per_gb_hour_usd / 1
            + 1 * settings.gpu_price_per_gpu_hour_usd / 1
            + 10 * settings.storage_price_per_gb_hour_usd / 1,
            6,
        )
        self.assertEqual(response.incremental_cost_usd, expected)
        self.assertEqual(response.workload_total_cost_usd, expected)
        self.assertEqual(response.account_balance_usd, round(settings.bootstrap_credit_usd - expected, 6))

    def test_endpoint_prefers_provider_route_when_public(self) -> None:
        provider_id, _provider_token = self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="endpoint",
                image="ghcr.io/acme/api:latest",
            )
        )
        route = self.store.publish_route(
            RoutePublishRequest(
                workload_id=workload.workload_id,
                hostname="api.example.com",
                path_prefix="/",
            )
        )
        self.assertEqual(workload.assigned_provider_id, provider_id)
        self.assertEqual(route.target_address, "https://provider-1.example.com")

    def test_provider_can_claim_scheduled_assignment(self) -> None:
        provider_id, _provider_token = self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
            )
        )
        assignment = self.store.claim_next_assignment(provider_id)
        self.assertIsNotNone(assignment)
        assert assignment is not None
        self.assertEqual(assignment.workload.workload_id, workload.workload_id)
        self.assertEqual(assignment.workload.status.value, "claimed")

    def test_volume_mounts_are_normalized_and_storage_roundtrips(self) -> None:
        self._register_provider()
        volume = self.store.create_volume(
            VolumeCreateRequest(
                workspace_id=self.workspace.workspace_id,
                name="datasets",
                size_gb=5,
                volume_type="object-storage",
            )
        )
        self.store.write_volume_blob(volume.volume_id, "models/config.json", b'{"ok":true}')
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
                volume_mounts=[{"locator": "datasets", "mount_path": "/data"}],
            )
        )
        self.assertEqual(workload.volume_mounts[0].locator, volume.volume_id)
        self.assertEqual(workload.volume_mounts[0].mount_path, "/data")
        entries = self.store.list_volume_entries(volume.volume_id)
        self.assertEqual(entries[0].path, "models/config.json")
        self.assertEqual(self.store.read_volume_blob(volume.volume_id, "models/config.json"), b'{"ok":true}')


if __name__ == "__main__":
    unittest.main()
