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


class TestBilling:
    def test_balance(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data={"balance_usd": 100.0, "credit_grants_usd": 50.0})):
            result = client.balance("user_123")
            assert result["balance_usd"] == 100.0

    def test_add_credits(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"success": True})):
            result = client.add_credits("user_123", 50.0)
            assert result["success"] is True


class TestRoutes:
    def test_list_routes(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"route_id": "rt_123", "endpoint_name": "api"}])):
            result = client.list_routes()
            assert len(result) == 1

    def test_create_route(self, client, mock_response):
        with patch.object(client._http, 'post', return_value=mock_response(json_data={"route_id": "rt_123", "endpoint_name": "api"})):
            result = client.create_route("wl_123", "api")
            assert result["route_id"] == "rt_123"


class TestSchedules:
    def test_list_schedules(self, client, mock_response):
        with patch.object(client._http, 'get', return_value=mock_response(json_data=[{"schedule_id": "sch_123", "name": "daily"}])):
            result = client.list_schedules()
            assert len(result) == 1

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
