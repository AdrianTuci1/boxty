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

from app import supervisor_cli, user_cli


class CliTests(unittest.TestCase):
    def test_user_signup_cli_calls_register_endpoint(self) -> None:
        captured: list[tuple[str, str, dict | None]] = []

        def fake_call(method: str, path: str, payload: dict | None = None):
            captured.append((method, path, payload))
            return {"user_id": "usr_123", "balance_usd": 20.0}

        stdout = io.StringIO()
        with patch("app.user_cli.call_api", side_effect=fake_call):
            with patch.object(sys, "argv", ["boxty-user", "signup", "--external-user-id", "adrian"]):
                with redirect_stdout(stdout):
                    user_cli.main()

        self.assertEqual(captured[0][0], "POST")
        self.assertEqual(captured[0][1], "/v1/auth/register")
        self.assertEqual(captured[0][2]["external_user_id"], "adrian")
        self.assertEqual(json.loads(stdout.getvalue())["balance_usd"], 20.0)

    def test_supervisor_meter_usage_cli_calls_meter_endpoint(self) -> None:
        captured: list[tuple[str, str, dict | None]] = []

        def fake_call(method: str, path: str, payload: dict | None = None):
            captured.append((method, path, payload))
            return {"incremental_cost_usd": 1.23}

        stdout = io.StringIO()
        with patch("app.supervisor_cli.call_api", side_effect=fake_call):
            with patch.object(
                sys,
                "argv",
                [
                    "boxty-supervisor",
                    "meter-usage",
                    "--workload-id",
                    "wl_123",
                    "--cpu-seconds",
                    "3600",
                    "--ram-gb-seconds",
                    "7200",
                ],
            ):
                with redirect_stdout(stdout):
                    supervisor_cli.main()

        self.assertEqual(captured[0][0], "POST")
        self.assertEqual(captured[0][1], "/v1/usage/meter")
        self.assertEqual(captured[0][2]["workload_id"], "wl_123")
        self.assertEqual(captured[0][2]["cpu_seconds"], 3600.0)
        self.assertEqual(json.loads(stdout.getvalue())["incremental_cost_usd"], 1.23)


if __name__ == "__main__":
    unittest.main()
