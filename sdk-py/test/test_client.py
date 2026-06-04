from __future__ import annotations
import unittest
from unittest.mock import patch, MagicMock

# Mock submodules so import works without real dependencies
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

    def test_defaults(self):
        # _load_config returns {} (no config file), so defaults apply
        client = Client()
        self.assertEqual(client.base_url, "https://api.boxty.dev")
        self.assertEqual(client.api_key, "")
        self.assertEqual(client.headers, {})

    def test_custom_api_key(self):
        client = Client(api_key="sk-test-123")
        self.assertEqual(client.api_key, "sk-test-123")
        self.assertEqual(client.headers.get("Authorization"), "Token sk-test-123")

    def test_custom_base_url(self):
        client = Client(api_key="k", base_url="http://localhost:3000")
        self.assertEqual(client.base_url, "http://localhost:3000")

    def test_trailing_slash_stripped(self):
        client = Client(api_key="k", base_url="http://localhost:3000/")
        self.assertEqual(client.base_url, "http://localhost:3000")


class TestClientAPIMethods(unittest.TestCase):
    """Verify all public methods exist."""

    def setUp(self):
        self.client = Client(api_key="test")

    def _check_method(self, name):
        method = getattr(self.client, name, None)
        self.assertIsNotNone(method, f"Method {name} is missing")
        self.assertTrue(callable(method), f"{name} is not callable")

    def test_sandbox_methods(self):
        for m in ["create_sandbox","list_sandboxes","get_sandbox","delete_sandbox","get_sandbox_metrics"]:
            self._check_method(m)

    def test_workspace_methods(self):
        for m in ["create_workspace","list_workspaces","get_workspace","delete_workspace"]:
            self._check_method(m)

    def test_app_methods(self):
        for m in ["create_app","list_apps","get_app","delete_app","stop_app","deploy_app","get_app_deployments","get_app_metrics","get_app_usage","get_app_logs"]:
            self._check_method(m)

    def test_instance_methods(self):
        for m in ["create_instance","list_instances","get_instance","delete_instance","get_instance_sandboxes"]:
            self._check_method(m)

    def test_billing_methods(self):
        for m in ["balance","usage","buy_credits"]:
            self._check_method(m)

    def test_secret_methods(self):
        for m in ["create_secret","list_secrets","delete_secret","attach_secrets"]:
            self._check_method(m)

    def test_schedule_methods(self):
        for m in ["create_schedule","list_schedules","delete_schedule","trigger_schedule"]:
            self._check_method(m)

    def test_volume_methods(self):
        for m in ["create_volume","list_volumes","delete_volume","mount_volume","unmount_volume"]:
            self._check_method(m)

    def test_image_methods(self):
        for m in ["build_image","list_images","delete_image"]:
            self._check_method(m)


if __name__ == "__main__":
    unittest.main()
