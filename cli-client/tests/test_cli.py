"""Tests for the Boxty CLI."""

import pytest
from click.testing import CliRunner
from unittest.mock import Mock, patch
from boxty_cli.main import cli


@pytest.fixture
def runner():
    return CliRunner()


@pytest.fixture
def mock_client():
    client = Mock()
    return client


class TestAuth:
    def test_login(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.login.return_value = {"user_id": "usr_123", "access_token": "tok_123"}
            result = runner.invoke(cli, ['auth', 'login', 'ext_123'])
            assert result.exit_code == 0
            assert "Login successful" in result.output

    def test_logout(self, runner):
        result = runner.invoke(cli, ['auth', 'logout'])
        assert result.exit_code == 0
        assert "Logged out" in result.output

    def test_whoami_not_logged_in(self, runner):
        with patch('boxty_cli.main.get_token', return_value=None):
            result = runner.invoke(cli, ['auth', 'whoami'])
            assert result.exit_code == 0
            assert "Not logged in" in result.output


class TestWorkspace:
    def test_list(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.workspaces.return_value = [{"workspace_id": "ws_123", "name": "test"}]
            result = runner.invoke(cli, ['workspace', 'list'])
            assert result.exit_code == 0
            assert "test" in result.output

    def test_create(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.create_workspace.return_value = {"workspace_id": "ws_123", "name": "test"}
            result = runner.invoke(cli, ['workspace', 'create', 'test', '--owner-id', 'owner_123'])
            assert result.exit_code == 0
            assert "Created workspace" in result.output

    def test_switch(self, runner):
        result = runner.invoke(cli, ['workspace', 'switch', 'ws_123'])
        assert result.exit_code == 0
        assert "Switched to workspace" in result.output


class TestApp:
    def test_list(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.list_workloads_filtered.return_value = [{"workload_id": "wl_123", "name": "test"}]
            result = runner.invoke(cli, ['app', 'list'])
            assert result.exit_code == 0
            assert "test" in result.output

    def test_deploy(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            with patch('boxty_cli.main._import_app_from_file') as mock_import:
                mock_app = Mock()
                mock_app.deploy.return_value = {
                    "app": "test",
                    "workspace_id": "ws_123",
                    "environment_id": "env_123",
                    "image_ids": ["img_123"],
                    "function_ids": {"hello": "wl_fn_123"},
                    "endpoint_ids": {"serve": "wl_ep_123"},
                    "route_ids": {"serve": "rt_123"},
                }
                mock_import.return_value = mock_app
                result = runner.invoke(cli, ['app', 'deploy', 'app.py'])
                assert result.exit_code == 0
                assert "Deployed app: test" in result.output
                assert "wl_fn_123" in result.output
                mock_app.deploy.assert_called_once_with(workspace=None, environment=None)


class TestVolume:
    def test_list(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.volumes.list.return_value = [{"volume_id": "vol_123", "name": "test"}]
            result = runner.invoke(cli, ['volume', 'list'])
            assert result.exit_code == 0
            assert "test" in result.output

    def test_create(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.volumes.create.return_value = {"volume_id": "vol_123", "name": "test"}
            result = runner.invoke(cli, ['volume', 'create', 'test'])
            assert result.exit_code == 0
            assert "Created volume" in result.output


class TestBilling:
    def test_balance(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.billing_balance.return_value = {"balance_usd": 100.0, "credit_grants_usd": 50.0}
            result = runner.invoke(cli, ['billing', 'balance', '--user-id', 'user_123'])
            assert result.exit_code == 0
            assert "100.0" in result.output

    def test_buy(self, runner, mock_client):
        with patch('boxty_cli.main.get_client', return_value=mock_client):
            mock_client.add_credits.return_value = {"success": True}
            result = runner.invoke(cli, ['billing', 'buy', '50.0', '--user-id', 'user_123'])
            assert result.exit_code == 0
            assert "Added $50.0" in result.output


class TestConfig:
    def test_set(self, runner):
        result = runner.invoke(cli, ['config', 'set', 'api_url', 'http://test.com'])
        assert result.exit_code == 0
        assert "Set api_url" in result.output

    def test_get(self, runner):
        with patch('boxty_cli.main.load_config', return_value={"api_url": "http://test.com"}):
            result = runner.invoke(cli, ['config', 'get', 'api_url'])
            assert result.exit_code == 0
            assert "http://test.com" in result.output

    def test_context(self, runner):
        with patch('boxty_cli.main.load_config', return_value={"active_workspace_id": "ws_123"}):
            result = runner.invoke(cli, ['context'])
            assert result.exit_code == 0
            assert "ws_123" in result.output
