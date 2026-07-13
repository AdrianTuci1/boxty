from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest


def test_e2e_deploy_and_run():
    """Run the full local deploy/invoke e2e flow once.

    This test is intentionally marked as slow and requires Docker. It is kept
    in the control-plane test suite so that CI can run it with the same venv
    that already has the CLI and SDK installed.
    """
    script = Path(__file__).resolve().parents[2] / "e2e-tests" / "run_e2e.py"
    result = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    assert result.returncode == 0, (
        f"E2E script failed:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    )
    assert "PASSED: function invoke" in result.stdout
    assert "PASSED: function second deploy" in result.stdout
    assert "PASSED: endpoint hit" in result.stdout


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
