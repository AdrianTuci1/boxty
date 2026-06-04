from __future__ import annotations
import unittest
from unittest.mock import patch, MagicMock

# Mock httpx before importing client
import sys
sys.modules["httpx"] = MagicMock()
sys.modules["boxty.sandbox"] = MagicMock()
sys.modules["boxty.image"] = MagicMock()
sys.modules["boxty.app"] = MagicMock()
sys.modules["boxty.secret"] = MagicMock()
sys.modules["boxty.schedule"] = MagicMock()
sys.modules["boxty.volume"] = MagicMock()
sys.modules["boxty.workspace"] = MagicMock()
sys.modules["boxty.environment"] = MagicMock()
sys.modules["boxty.exceptions"] = MagicMock()

from boxty.client import Client


class TestClientConstructor(unittest.TestCase):

    @patch("boxty.client._load_config")
    def test_defaults(self, mock_cfg):
        mock_cfg.return_value = {}
        client = Client()
        self.assertEqual(client.base_url, "https://api.boxty.dev")
        self.assertEqual(client.api_key, "")
        self.assertEqual(client.headers, {})

    @patch("boxty.client._load_config")
    def test_custom_api_key(self, mock_cfg):
        mock_cfg.return_value = {}
        client = Client(api_key="sk-test-123")
        self.assertEqual(client.api_key, "sk-test-123")
        self.assertEqual(client.headers.get("Authorization"), "Token sk-test-123")

    @patch("boxty.client._load_config")
    def test_custom_base_url(self, mock_cfg):
        mock_cfg.return_value = {}
        client = Client(base_url="http://localhost:3000")
        self.assertEqual(client.base_url, "http://localhost:3000")

    @patch("boxty.client._load_config")
    def test_trailing_slash_stripped(self, mock_cfg):
        mock_cfg.return_value = {}
        client = Client(base_url="http://localhost:3000/")
        self.assertEqual(client.base_url, "http://localhost:3000")

    @patch("boxty.client._load_config")
    def test_config_overrides(self, mock_cfg):
        mock_cfg.return_value = {"api_key": "cfg-key", "base_url": "http://from-cfg:4000"}
        client = Client()
        self.assertEqual(client.api_key, "cfg-key")
        self.assertEqual(client.base_url, "http://from-cfg:4000")

    @patch("boxty.client._load_config")
    def test_explicit_overrides_config(self, mock_cfg):
        mock_cfg.return_value = {"api_key": "cfg-key", "base_url": "http://from-cfg:4000"}
        client = Client(api_key="explicit-key", base_url="http://explicit:5000")
        self.assertEqual(client.api_key, "explicit-key")
        self.assertEqual(client.base_url, "http://explicit:5000")


class TestClientAPIMethods(unittest.TestCase):
    """Verify all public methods exist with correct signatures."""

    def setUp(self):
        with patch("boxty.client._load_config", return_value={"api_key": "test"}):
            self.client = Client()

    def _check_method(self, name, min_args):
        """Verify method exists and has at least min_args parameters."""
        method = getattr(self.client, name, None)
        self.assertIsNotNone(method, f"Method {name} is missing")
        self.assertTrue(callable(method), f"{name} is not callable")

    def test_sandbox_methods(self):
        self._check_method("create_sandbox", 1)
        self._check_method("list_sandboxes", 0)
        self._check_method("get_sandbox", 1)
        self._check_method("delete_sandbox", 1)
        self._check_method("get_sandbox_metrics", 1)

    def test_workspace_methods(self):
        self._check_method("create_workspace", 1)
        self._check_method("list_workspaces", 0)
        self._check_method("get_workspace", 1)
        self._check_method("delete_workspace", 1)

    def test_app_methods(self):
        self._check_method("create_app", 4)
        self._check_method("list_apps", 0)
        self._check_method("get_app", 1)
        self._check_method("delete_app", 1)
        self._check_method("stop_app", 1)
        self._check_method("deploy_app", 2)
        self._check_method("get_app_deployments", 1)
        self._check_method("get_app_metrics", 1)
        self._check_method("get_app_usage", 1)
        self._check_method("get_app_logs", 1)

    def test_instance_methods(self):
        self._check_method("create_instance", 2)
        self._check_method("list_instances", 1)
        self._check_method("get_instance", 2)
        self._check_method("delete_instance", 2)
        self._check_method("get_instance_sandboxes", 2)

    def test_billing_methods(self):
        self._check_method("balance", 0)
        self._check_method("usage", 0)
        self._check_method("buy_credits", 1)

    def test_secret_methods(self):
        self._check_method("create_secret", 2)
        self._check_method("list_secrets", 0)
        self._check_method("delete_secret", 1)
        self._check_method("attach_secrets", 2)

    def test_schedule_methods(self):
        self._check_method("create_schedule", 9)
        self._check_method("list_schedules", 0)
        self._check_method("delete_schedule", 1)
        self._check_method("trigger_schedule", 1)

    def test_volume_methods(self):
        self._check_method("create_volume", 1)
        self._check_method("list_volumes", 0)
        self._check_method("delete_volume", 1)
        self._check_method("mount_volume", 3)
        self._check_method("unmount_volume", 2)

    def test_image_methods(self):
        self._check_method("build_image", 3)
        self._check_method("list_images", 0)
        self._check_method("delete_image", 1)


if __name__ == "__main__":
    unittest.main()
