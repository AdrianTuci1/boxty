#!/bin/sh
# Boxty CLI Installer — installs the Python CLI from the local repo or PyPI.
# Usage: curl -fsSL https://cli.boxty.dev/install | sh
#        ./install.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# If this script is run from the repo, install from the local cli/ directory.
# Otherwise, install from PyPI.
if [ -d "$REPO_ROOT/boxty_cli" ] || [ -f "$REPO_ROOT/pyproject.toml" ]; then
    echo "Installing Boxty CLI from local repository..."
    python3 -m pip install -e "$REPO_ROOT" --upgrade
else
    echo "Installing Boxty CLI from PyPI..."
    python3 -m pip install boxty-cli --upgrade
fi

echo "Boxty CLI installed. Run 'boxty --help' to get started."
