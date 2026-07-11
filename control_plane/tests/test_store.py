from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

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
    ScheduleCreateRequest,
    SecretCreateRequest,
    UsageMeterRequest,
    VolumeCreateRequest,
    WorkloadCreateRequest,
)
from app.store import InMemoryStore


class ControlPlaneStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        object.__setattr__(settings, "secret_encryption_key", "test-secret-key")
        # Patch R2 storage to an in-memory fake for deterministic tests
        import app.store as store_module
        self._r2_data: dict[str, bytes] = {}

        class _FakeR2:
            def put_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
                self._r2_data[key] = data

            def get_bytes(self, key: str) -> bytes:
                return self._r2_data.get(key, b"")

            def list_keys(self, prefix: str):
                for key in self._r2_data:
                    if key.startswith(prefix):
                        yield {"key": key, "size": len(self._r2_data[key])}

            def delete_key(self, key: str) -> None:
                self._r2_data.pop(key, None)

        fake = _FakeR2()
        fake._r2_data = self._r2_data
        store_module.r2_storage_client = fake
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
        with patch.object(
            sys.modules["app.store"],
            "generate_token",
            return_value="bx_knownapitokenvalue",
        ):
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
        self.assertTrue(api_key.secret_preview.startswith("bx_"))
        self.assertTrue(api_key.secret_token_hash)
        self.assertTrue(api_key.secret_token_salt)
        self.assertFalse(api_key.secret_token)
        self.assertIsNone(self.store.verify_api_key(api_key.api_key_id, "wrong-token"))
        self.assertIsNotNone(self.store.verify_api_key(api_key.api_key_id, "bx_knownapitokenvalue"))
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
        print("after write", self._r2_data)
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

    def test_load_from_dynamodb_populates_store(self) -> None:
        """Test that load_from_dynamodb correctly reconstructs records from raw DynamoDB items."""
        # Set up a fresh store and populate it with data
        store1 = InMemoryStore()
        store1.register_user(
            user_id="usr_test",
            external_user_id="adrian",
            email="adrian@example.com",
        )
        
        # Export the items as they would appear in DynamoDB
        exported = store1.export_single_table_items()
        
        # Simulate raw DynamoDB items by flattening pk/sk/entity_type with attributes
        raw_items = []
        for item in exported:
            raw = {
                "pk": item.pk,
                "sk": item.sk,
                "entity_type": item.entity_type,
                **item.attributes,
            }
            raw_items.append(raw)
        
        # Create a new store and load from the simulated DynamoDB items
        store2 = InMemoryStore()
        with patch("app.store.dynamo_mirror") as mock_mirror:
            mock_mirror.scan_all.return_value = raw_items
            store2.load_from_dynamodb()
        
        # Verify all records were loaded correctly
        self.assertEqual(len(store2.users), 1)
        self.assertEqual(len(store2.accounts), 1)
        self.assertEqual(len(store2.workspaces), 1)
        self.assertEqual(len(store2.environments), 1)
        
        # Verify user record
        user = store2.users["usr_test"]
        self.assertEqual(user.external_user_id, "adrian")
        self.assertEqual(user.email, "adrian@example.com")
        
        # Verify account record
        account = store2.accounts["usr_test"]
        self.assertEqual(account.balance_usd, settings.bootstrap_credit_usd)
        
        # Verify workspace record
        workspace = list(store2.workspaces.values())[0]
        self.assertEqual(workspace.owner_id, "usr_test")
        self.assertTrue(workspace.is_default)
        
        # Verify environment record
        environment = list(store2.environments.values())[0]
        self.assertEqual(environment.workspace_id, workspace.workspace_id)
        self.assertTrue(environment.is_default)
        self.assertEqual(environment.name, "main")

    def test_load_from_dynamodb_skips_unknown_entity_types(self) -> None:
        """Test that load_from_dynamodb gracefully skips unknown entity types."""
        store = InMemoryStore()
        raw_items = [
            {
                "pk": "UNKNOWN#123",
                "sk": "PROFILE",
                "entity_type": "UnknownEntity",
                "some_field": "value",
            }
        ]
        with patch("app.store.dynamo_mirror") as mock_mirror:
            mock_mirror.scan_all.return_value = raw_items
            store.load_from_dynamodb()
        
        # Store should remain empty
        self.assertEqual(len(store.users), 0)
        self.assertEqual(len(store.accounts), 0)

    def test_load_from_dynamodb_handles_scan_failure(self) -> None:
        """Test that load_from_dynamodb handles scan failures gracefully."""
        store = InMemoryStore()
        with patch("app.store.dynamo_mirror") as mock_mirror:
            mock_mirror.scan_all.side_effect = Exception("connection failed")
            store.load_from_dynamodb()
        
        # Store should remain empty after failed scan
        self.assertEqual(len(store.users), 0)


    def test_trigger_schedule_creates_workload(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="function",
                image="alpine:latest",
                command=["echo", "hello"],
            )
        )
        schedule = self.store.create_schedule(
            ScheduleCreateRequest(
                name="test-schedule",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                owner_id="usr_test",
                workload_id=workload.workload_id,
                interval_seconds=60,
            )
        )
        schedule_id = schedule.schedule_id
        schedule, triggered_workload = self.store.trigger_schedule(schedule_id)
        self.assertIsNotNone(triggered_workload)
        self.assertNotEqual(triggered_workload.workload_id, workload.workload_id)
        self.assertEqual(triggered_workload.status.value, "scheduled")
        self.assertEqual(schedule.workload_id, workload.workload_id)
        self.assertIsNotNone(schedule.last_run_at)


    def test_workload_status_change_writes_log(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
            )
        )
        from app.models import WorkloadStatusUpdateRequest
        self.store.update_workload_status(
            workload.workload_id,
            WorkloadStatusUpdateRequest(status="running", runtime_details={}),
        )
        logs = self.store.workload_logs(workload.workload_id)
        self.assertTrue(any("running" in log.message for log in logs))

    def test_invoke_function_writes_log_and_invocation(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="function",
                image="python:3.11",
            )
        )
        from app.models import WorkloadInvokeRequest
        invocation = self.store.invoke_workload_sync(workload.workload_id, WorkloadInvokeRequest(payload={"x": 1}))
        invocations = self.store.list_function_invocations_by_workload(workload.workload_id)
        logs = self.store.workload_logs(workload.workload_id)
        self.assertEqual(invocation.workload_id, workload.workload_id)
        self.assertEqual(len(invocations), 1)
        self.assertTrue(any(invocation.invocation_id in log.message for log in logs))

    def test_sandbox_session_lifecycle(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
            )
        )
        from app.models import SandboxSessionRequest
        session = self.store.create_sandbox_session(
            SandboxSessionRequest(workload_id=workload.workload_id, requester_id="usr_test")
        )
        self.assertIn(session.session_id, self.store.sessions)
        self.assertTrue(self.store.delete_sandbox_session(session.session_id))
        self.assertNotIn(session.session_id, self.store.sessions)

    def test_sandbox_filesystem_returns_entries(self) -> None:
        self._register_provider()
        workload = self.store.create_workload(
            WorkloadCreateRequest(
                owner_id="usr_test",
                workspace_id=self.workspace.workspace_id,
                environment_id=self.environment.environment_id,
                kind="sandbox",
                image="ubuntu:22.04",
            )
        )
        from app.models import SandboxSessionRequest
        session = self.store.create_sandbox_session(
            SandboxSessionRequest(workload_id=workload.workload_id, requester_id="usr_test")
        )
        entries = self.store.list_sandbox_files(session.session_id, "/")
        self.assertTrue(any(e.name == "README.md" and e.entry_type == "file" for e in entries))

    def test_volume_entry_crud(self) -> None:
        from app.models import VolumeEntry
        entry = self.store.create_volume_entry(
            VolumeEntry(volume_id="vol_1", path="/a.txt", size_bytes=5)
        )
        self.assertEqual(self.store.get_volume_entry(entry.entry_id).path, "/a.txt")
        self.assertTrue(self.store.delete_volume_entry(entry.entry_id))
        with self.assertRaises(KeyError):
            self.store.get_volume_entry(entry.entry_id)


if __name__ == "__main__":
    unittest.main()
