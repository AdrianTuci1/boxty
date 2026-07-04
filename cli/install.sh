#!/bin/sh
# Boxty CLI Installer
# Usage: curl -fsSL https://cli.boxty.dev/install | sh

set -e

INSTALL_DIR="${BOXTY_INSTALL_DIR:-$HOME/.local/bin}"
REPO_DIR="${BOXTY_REPO_DIR:-}"
PYTHON_BIN="${BOXTY_PYTHON:-python3}"

# If running from a local repo, install the cli/ package in editable mode.
if [ -n "$REPO_DIR" ] && [ -d "$REPO_DIR/cli" ]; then
    echo "📦 Installing Boxty Python CLI from $REPO_DIR/cli"
    "$PYTHON_BIN" -m pip install -e "$REPO_DIR/cli"
else
    # Default remote install: clone and install.
    TMPDIR="$(mktemp -d)"
    echo "📦 Cloning Boxty repository..."
    git clone --depth 1 https://github.com/AdrianTuci1/boxty.git "$TMPDIR/boxty" 2>/dev/null || {
        echo "❌ Failed to clone repository. Make sure git is installed and network is available."
        exit 1
    }
    echo "📦 Installing Boxty Python CLI..."
    "$PYTHON_BIN" -m pip install -e "$TMPDIR/boxty/cli"
    rm -rf "$TMPDIR"
fi

mkdir -p "$INSTALL_DIR"

# Create a wrapper script so users can invoke `boxty` without Python module syntax.
WRAPPER="$INSTALL_DIR/boxty"
cat > "$WRAPPER" <<EOF
#!/bin/sh
exec "$PYTHON_BIN" -m boxty_cli.main "\$@"
EOF
chmod +x "$WRAPPER"

echo "✅ Installed Boxty CLI to $WRAPPER"
if command -v boxty >/dev/null 2>&1; then
    echo "🎉 Run 'boxty --help' to get started."
else
    echo "⚠️  $INSTALL_DIR is not in your PATH. Add it with:"
    echo "   export PATH=\"$INSTALL_DIR:\$PATH\""
fi
