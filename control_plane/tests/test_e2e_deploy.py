from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest


pytestmark = pytest.mark.skipif(
    not os.environ.get("BOXTY_RUN_LOCAL_E2E"),
    reason="E2E requires Docker and the locally built CLI/SKD; set BOXTY_RUN_LOCAL_E2E=1 to run",
)

def test_e2e_deploy_and_run():
    """Run the full local deploy/invoke e2e flow once.

    This test is intentionally local-only: it requires Docker, a local control
    plane venv, and the locally installed CLI and SDK. CI skips it.
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
