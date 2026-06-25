from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import worker_cli


class WorkerCliTests(unittest.TestCase):
    def test_register_calls_provider_register_endpoint(self) -> None:
        captured: list[tuple[str, str, dict | None]] = []

        def fake_call(method: str, path: str, payload: dict | None = None, headers: dict | None = None):
            captured.append((method, path, payload))
            return {"provider_id": "prov_123"}

        stdout = io.StringIO()
        with patch("app.worker_cli.call_api", side_effect=fake_call):
            with patch.object(
                sys,
                "argv",
                [
                    "boxty-worker",
                    "register",
                    "--provider-name",
                    "worker-1",
                    "--region",
                    "eu-central",
                    "--cpu",
                    "4",
                    "--memory-mb",
                    "8192",
                    "--disk-gb",
                    "100",
                ],
            ):
                with redirect_stdout(stdout):
                    worker_cli.main()

        self.assertEqual(captured[0][1], "/v1/providers/register")
        self.assertEqual(captured[0][2]["provider_name"], "worker-1")
        self.assertEqual(json.loads(stdout.getvalue())["provider_id"], "prov_123")


if __name__ == "__main__":
    unittest.main()
