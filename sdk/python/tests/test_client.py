"""Tests for the Boxty Python SDK client."""

import pytest
from unittest.mock import Mock, patch
from boxty import Boxty
from boxty.exceptions import BoxtyError, BoxtyNotFoundError


@pytest.fixture
def client():
    return Boxty(base_url="http://localhost:8080")


@pytest.fixture
def mock_response():
    def _mock_response(status_code=200, json_data=None):
        mock = Mock()
        mock.status_code = status_code
        mock.json.return_value = json_data or {}
        mock.raise_for_status.return_value = None
        return mock
    return _mock_response


class TestAuth:
    def test_login(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"user_id": "usr_123", "access_token": "tok_123"})):
            result = client.login("ext_123", "test@example.com")
            assert result["user_id"] == "usr_123"
            assert result["access_token"] == "tok_123"

    def test_signup(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"user_id": "usr_123", "access_token": "tok_123"})):
            result = client.signup("ext_123", "test@example.com")
            assert result["user_id"] == "usr_123"

    def test_whoami(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"user_id": "usr_123", "external_user_id": "ext_123", "email": "test@example.com"})):
            result = client.whoami("tok_123")
            assert result["user_id"] == "usr_123"
            assert result["email"] == "test@example.com"


class TestWorkspaces:
    def test_list_workspaces(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"workspace_id": "ws_123", "name": "test"}])):
            result = client.workspaces()
            assert len(result) == 1
            assert result[0]["name"] == "test"

    def test_create_workspace(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"workspace_id": "ws_123", "name": "test"})):
            result = client.create_workspace("owner_123", "test")
            assert result["workspace_id"] == "ws_123"

    def test_get_workspace(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"workspace_id": "ws_123", "name": "test"})):
            result = client.get_workspace("ws_123")
            assert result["workspace_id"] == "ws_123"

    def test_update_workspace(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"workspace_id": "ws_123", "name": "updated"})):
            result = client.update_workspace("ws_123", name="updated")
            assert result["name"] == "updated"

    def test_delete_workspace(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_workspace("ws_123")
            assert result["deleted"] is True


class TestEnvironments:
    def test_list_environments(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"environment_id": "env_123", "name": "prod"}])):
            result = client.environments("ws_123")
            assert len(result) == 1

    def test_create_environment(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"environment_id": "env_123", "name": "prod"})):
            result = client.create_environment("ws_123", "prod")
            assert result["environment_id"] == "env_123"

    def test_get_environment(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"environment_id": "env_123", "name": "prod"})):
            result = client.get_environment("env_123")
            assert result["name"] == "prod"

    def test_update_environment(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"environment_id": "env_123", "name": "staging"})):
            result = client.update_environment("env_123", name="staging")
            assert result["name"] == "staging"

    def test_delete_environment(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_environment("env_123")
            assert result["deleted"] is True


class TestApiKeys:
    def test_list_api_keys(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"api_key_id": "key_123", "name": "test"}])):
            result = client.api_keys()
            assert len(result) == 1

    def test_create_api_key(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"api_key_id": "key_123", "name": "test"})):
            result = client.create_api_key("owner_123", "ws_123", "env_123", "test")
            assert result["api_key_id"] == "key_123"

    def test_get_api_key(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"api_key_id": "key_123", "name": "test"})):
            result = client.get_api_key("key_123")
            assert result["name"] == "test"

    def test_update_api_key(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"api_key_id": "key_123", "name": "updated"})):
            result = client.update_api_key("key_123", name="updated")
            assert result["name"] == "updated"

    def test_delete_api_key(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_api_key("key_123")
            assert result["deleted"] is True


class TestSecrets:
    def test_list_secrets(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"secret_id": "sec_123", "name": "test"}])):
            result = client.secrets.list("ws_123")
            assert len(result) == 1

    def test_create_secret(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"secret_id": "sec_123", "name": "test"})):
            result = client.secrets.create("ws_123", "test", {"KEY": "value"})
            assert result["name"] == "test"

    def test_get_secret(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"secret_id": "sec_123", "name": "test"})):
            result = client.secrets.get("ws_123", "test")
            assert result["name"] == "test"

    def test_update_secret(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"secret_id": "sec_123", "name": "test"})):
            result = client.secrets.update("ws_123", "test", {"KEY": "new_value"})
            assert result["secret_id"] == "sec_123"

    def test_delete_secret(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.secrets.delete("ws_123", "test")
            assert result is True


class TestVolumes:
    def test_list_volumes(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"volume_id": "vol_123", "name": "test"}])):
            result = client.volumes.list("ws_123")
            assert len(result) == 1

    def test_create_volume(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"volume_id": "vol_123", "name": "test"})):
            result = client.volumes.create("ws_123", "test", 10, "object-storage")
            assert result["volume_id"] == "vol_123"

    def test_get_volume(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"volume_id": "vol_123", "name": "test"})):
            result = client.volumes.get("ws_123", "vol_123")
            assert result["name"] == "test"

    def test_delete_volume(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.volumes.delete("ws_123", "vol_123")
            assert result is True

    def test_list_entries(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"path": "/test", "entry_type": "file"}])):
            result = client.volumes.list_entries("vol_123", "/")
            assert len(result) == 1

    def test_put_entry(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"path": "/test", "entry_type": "file"})):
            result = client.volumes.put_entry("vol_123", "/test", "content")
            assert result["path"] == "/test"

    def test_get_blob(self, client, mock_response):
        mock = Mock()
        mock.status_code = 200
        mock.content = b"blob data"
        mock.raise_for_status.return_value = None
        with patch.object(client._http, 'get', return_value=mock):
            result = client.volumes.get_blob("vol_123", "/test.bin")
            assert result == b"blob data"


class TestDatabases:
    def test_list_databases(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"database_id": "db_123", "name": "test"}])):
            result = client.databases.list("ws_123")
            assert len(result) == 1

    def test_create_database(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"database_id": "db_123", "name": "test"})):
            result = client.databases.create("ws_123", "test", "pk", "sk")
            assert result["database_id"] == "db_123"

    def test_get_database(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"database_id": "db_123", "name": "test"})):
            result = client.databases.get("db_123")
            assert result["name"] == "test"

    def test_delete_database(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.databases.delete("db_123")
            assert result is True

    def test_get_item(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"item_id": "item_123", "pk": "pk1", "sk": "sk1"})):
            result = client.databases.get_item("db_123", "pk1", "sk1")
            assert result["pk"] == "pk1"

    def test_query(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data=[{"pk": "pk1", "sk": "sk1"}])):
            result = client.databases.query("db_123", pk="pk1")
            assert len(result) == 1


class TestWorkloads:
    def test_list_workloads(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"workload_id": "wl_123", "name": "test"}])):
            result = client.list_workloads()
            assert len(result) == 1

    def test_create_workload(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"workload_id": "wl_123", "name": "test"})):
            result = client.create_workload(
                owner_id="owner_123",
                workspace_id="ws_123",
                environment_id="env_123",
                kind="sandbox",
                image="python:3.9",
            )
            assert result["workload_id"] == "wl_123"

    def test_get_workload(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"workload_id": "wl_123", "name": "test"})):
            result = client.get_workload("wl_123")
            assert result["workload_id"] == "wl_123"

    def test_update_workload(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"workload_id": "wl_123", "name": "updated"})):
            result = client.update_workload("wl_123", name="updated")
            assert result["name"] == "updated"

    def test_update_workload_status(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"workload_id": "wl_123", "status": "running"})):
            result = client.update_workload_status("wl_123", "running")
            assert result["status"] == "running"

    def test_delete_workload(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_workload("wl_123")
            assert result["deleted"] is True

    def test_get_workload_metrics(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"cpu_seconds": 100.0})):
            result = client.get_workload_metrics("wl_123")
            assert result["cpu_seconds"] == 100.0

    def test_get_workload_logs(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"timestamp": "2024-01-01", "message": "log"}])):
            result = client.get_workload_logs("wl_123")
            assert len(result) == 1

    def test_get_workload_launch_spec(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"workload": {"workload_id": "wl_123"}})):
            result = client.get_workload_launch_spec("wl_123")
            assert result["workload"]["workload_id"] == "wl_123"


class TestRoutes:
    def test_list_routes(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"route_id": "rt_123", "endpoint_name": "api"}])):
            result = client.list_routes()
            assert len(result) == 1

    def test_create_route(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"route_id": "rt_123", "endpoint_name": "api"})):
            result = client.create_route("wl_123", "api")
            assert result["route_id"] == "rt_123"

    def test_get_route(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"route_id": "rt_123", "endpoint_name": "api"})):
            result = client.get_route("rt_123")
            assert result["endpoint_name"] == "api"

    def test_delete_route(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_route("rt_123")
            assert result["deleted"] is True


class TestSchedules:
    def test_list_schedules(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"schedule_id": "sch_123", "name": "daily"}])):
            result = client.list_schedules()
            assert len(result) == 1

    def test_create_schedule(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"schedule_id": "sch_123", "name": "daily"})):
            result = client.create_schedule("daily", "cron", "0 0 * * *", "func", "ws_123", "env_123")
            assert result["schedule_id"] == "sch_123"

    def test_get_schedule(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"schedule_id": "sch_123", "name": "daily"})):
            result = client.get_schedule("sch_123")
            assert result["name"] == "daily"

    def test_update_schedule(self, client, mock_response):
        with patch.object(client._http, 'patch', return_value=mock_response(json_data={"schedule_id": "sch_123", "name": "weekly"})):
            result = client.update_schedule("sch_123", name="weekly")
            assert result["name"] == "weekly"

    def test_delete_schedule(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_schedule("sch_123")
            assert result["deleted"] is True

    def test_trigger_schedule(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"triggered": True})):
            result = client.trigger_schedule("sch_123")
            assert result["triggered"] is True


class TestImages:
    def test_list_images(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"image_id": "img_123", "name": "python"}])):
            result = client.list_images()
            assert len(result) == 1

    def test_build_image(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"image_id": "img_123", "name": "custom"})):
            result = client.build_image("custom", dockerfile="FROM python:3.9")
            assert result["image_id"] == "img_123"

    def test_get_image(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"image_id": "img_123", "name": "custom"})):
            result = client.get_image("img_123")
            assert result["name"] == "custom"

    def test_delete_image(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_image("img_123")
            assert result["deleted"] is True


class TestBilling:
    def test_balance(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"balance_usd": 100.0, "credit_grants_usd": 50.0})):
            result = client.balance("user_123")
            assert result["balance_usd"] == 100.0

    def test_add_credits(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"success": True})):
            result = client.add_credits("user_123", 50.0)
            assert result["success"] is True

    def test_create_checkout(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"checkout_url": "https://stripe.com/checkout", "session_id": "sess_123", "status": "pending"})):
            result = client.create_checkout("user_123", 50.0)
            assert result["status"] == "pending"

    def test_get_billing_history(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"history_id": "bh_123", "type": "credit_purchase"}])):
            result = client.get_billing_history("user_123")
            assert len(result) == 1

    def test_get_invoices(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"invoice_id": "inv_123"}])):
            result = client.get_invoices("user_123")
            assert len(result) == 1


class TestUsage:
    def test_list_usage(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"usage_id": "usg_123", "workload_id": "wl_123"}])):
            result = client.list_usage("wl_123")
            assert len(result) == 1

    def test_meter_usage(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"incremental_cost_usd": 0.5})):
            result = client.meter_usage("wl_123", cpu_seconds=100.0)
            assert result["incremental_cost_usd"] == 0.5


class TestDashboard:
    def test_dashboard(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"total_workloads": 5})):
            result = client.dashboard("ws_123", "env_123")
            assert result["total_workloads"] == 5

    def test_dashboard_summary(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"running_workloads": 3})):
            result = client.dashboard_summary("ws_123", "env_123")
            assert result["running_workloads"] == 3


class TestInvites:
    def test_list_invites(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"invite_id": "inv_123", "email": "test@example.com"}])):
            result = client.list_invites("ws_123")
            assert len(result) == 1

    def test_create_invite(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"invite_id": "inv_123", "email": "test@example.com"})):
            result = client.create_invite("ws_123", "test@example.com", "developer")
            assert result["invite_id"] == "inv_123"

    def test_get_invite(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"invite_id": "inv_123", "email": "test@example.com"})):
            result = client.get_invite("inv_123")
            assert result["email"] == "test@example.com"

    def test_accept_invite(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"accepted": True})):
            result = client.accept_invite("token_123")
            assert result["accepted"] is True

    def test_delete_invite(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_invite("inv_123")
            assert result["deleted"] is True


class TestProviders:
    def test_list_providers(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"provider_id": "prov_123", "name": "test"}])):
            result = client.list_providers()
            assert len(result) == 1

    def test_get_provider(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"provider_id": "prov_123", "name": "test"})):
            result = client.get_provider("prov_123")
            assert result["name"] == "test"

    def test_register_provider(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"provider_id": "prov_123", "name": "test"})):
            result = client.register_provider("test", "us-east", "general", 10)
            assert result["provider_id"] == "prov_123"

    def test_delete_provider(self, client, mock_response):
        with patch.object(client._http, 'delete', return_value=mock_response(json_data={"deleted": True})):
            result = client.delete_provider("prov_123")
            assert result["deleted"] is True

    def test_provider_heartbeat(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"provider_id": "prov_123", "available_slots": 5})):
            result = client.provider_heartbeat("prov_123", 5, 2, "online")
            assert result["available_slots"] == 5

    def test_claim_next_assignment(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"workload_id": "wl_123"})):
            result = client.claim_next_assignment("prov_123")
            assert result["workload_id"] == "wl_123"


class TestSandboxSessions:
    def test_create_sandbox_session(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"session_id": "ssh_123", "token": "tok_123"})):
            result = client.create_sandbox_session("wl_123", "user_123", 900)
            assert result["session_id"] == "ssh_123"

    def test_verify_sandbox_session(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"session_id": "ssh_123", "workload_id": "wl_123"})):
            result = client.verify_sandbox_session("tok_123")
            assert result["workload_id"] == "wl_123"


class TestRunPod:
    def test_dispatch_runpod(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"dispatch": {"external_id": "rp_123"}})):
            result = client.dispatch_runpod("wl_123", "template_1", "RTX_A5000", 1)
            assert result["dispatch"]["external_id"] == "rp_123"
