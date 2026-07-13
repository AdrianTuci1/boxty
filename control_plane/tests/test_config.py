from __future__ import annotations

import os
import subprocess
import sys
import unittest
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@contextmanager
def _override_setting(name: str, value: str):
    """Temporarily override a frozen Settings field."""
    from app.config import settings

    original = getattr(settings, name)
    object.__setattr__(settings, name, value)
    try:
        yield
    finally:
        object.__setattr__(settings, name, original)


class ProductionConfigTests(unittest.TestCase):
    """Validate production config requirements in isolated subprocesses.

    Module-level validation mutates the global ``settings`` singleton, so
    each assertion runs in a fresh Python process to avoid polluting the
    test runner's state.
    """

    @staticmethod
    def _run_import(env: dict[str, str]) -> tuple[int, str]:
        code = "import app.config"
        result = subprocess.run(
            [sys.executable, "-c", code],
            cwd=str(ROOT),
            env={**os.environ, **env},
            capture_output=True,
            text=True,
        )
        return result.returncode, result.stderr

    def test_production_requires_dynamodb_state_store(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "production",
            "BOXTY_STATE_STORE": "memory",
            "BOXTY_SECRET_ENCRYPTION_KEY": "secret",
            "BOXTY_PROVIDER_TOKEN": "token",
            "BOXTY_OBJECT_STORAGE_PROVIDER": "cloudflare-r2",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("requires BOXTY_STATE_STORE=dynamodb-single-table", stderr)

    def test_production_requires_dynamodb_table_name(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "production",
            "BOXTY_STATE_STORE": "dynamodb-single-table",
            "BOXTY_SECRET_ENCRYPTION_KEY": "secret",
            "BOXTY_PROVIDER_TOKEN": "token",
            "BOXTY_OBJECT_STORAGE_PROVIDER": "cloudflare-r2",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("requires BOXTY_DYNAMODB_TABLE_NAME", stderr)

    def test_production_requires_secret_encryption_key(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "production",
            "BOXTY_STATE_STORE": "dynamodb-single-table",
            "BOXTY_DYNAMODB_TABLE_NAME": "boxty",
            "BOXTY_PROVIDER_TOKEN": "token",
            "BOXTY_OBJECT_STORAGE_PROVIDER": "cloudflare-r2",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("requires BOXTY_SECRET_ENCRYPTION_KEY", stderr)

    def test_production_requires_provider_token(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "production",
            "BOXTY_STATE_STORE": "dynamodb-single-table",
            "BOXTY_DYNAMODB_TABLE_NAME": "boxty",
            "BOXTY_SECRET_ENCRYPTION_KEY": "secret",
            "BOXTY_OBJECT_STORAGE_PROVIDER": "cloudflare-r2",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("requires BOXTY_PROVIDER_TOKEN", stderr)

    def test_production_requires_non_filesystem_storage(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "production",
            "BOXTY_STATE_STORE": "dynamodb-single-table",
            "BOXTY_DYNAMODB_TABLE_NAME": "boxty",
            "BOXTY_SECRET_ENCRYPTION_KEY": "secret",
            "BOXTY_PROVIDER_TOKEN": "token",
            "BOXTY_OBJECT_STORAGE_PROVIDER": "filesystem",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("non-filesystem object storage provider", stderr)

    def test_dynamodb_store_requires_table_name(self) -> None:
        env = {
            "BOXTY_ENVIRONMENT": "development",
            "BOXTY_STATE_STORE": "dynamodb-single-table",
            "BOXTY_SECRET_ENCRYPTION_KEY": "secret",
        }
        rc, stderr = self._run_import(env)
        self.assertNotEqual(rc, 0)
        self.assertIn("requires BOXTY_DYNAMODB_TABLE_NAME", stderr)


class DynamoDBStartupTests(unittest.TestCase):
    """Validate startup behaviour without reloading global config modules."""

    def test_startup_loads_from_dynamodb_when_enabled(self) -> None:
        from app.main import lifespan, app
        from app.store import store
        from contextlib import AsyncExitStack

        with _override_setting("state_store", "dynamodb-single-table"):
            with _override_setting("dynamodb_table_name", "boxty"):
                with patch.object(store, "load_from_dynamodb") as mock_load:
                    import asyncio

                    async def _run():
                        async with AsyncExitStack() as stack:
                            await stack.enter_async_context(lifespan(app))
                            mock_load.assert_called_once()

                    asyncio.run(_run())

    def test_startup_skips_dynamodb_load_for_memory_store(self) -> None:
        from app.main import lifespan, app
        from app.store import store
        from contextlib import AsyncExitStack

        with _override_setting("state_store", "memory"):
            with patch.object(store, "load_from_dynamodb") as mock_load:
                import asyncio

                async def _run():
                    async with AsyncExitStack() as stack:
                        await stack.enter_async_context(lifespan(app))
                        mock_load.assert_not_called()

                asyncio.run(_run())
