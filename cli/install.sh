#!/bin/sh
# Boxty CLI Installer — auto-detects platform and downloads latest binary
# Usage: curl -fsSL https://cli.boxty.dev/install | sh
#        curl -fsSL https://cli.boxty.dev/install | sh -s -- v1.2.3

set -e

VERSION="${1:-latest}"
BASE_URL="${BOXTY_CLI_URL:-https://cli.boxty.dev}"
INSTALL_DIR="${BOXTY_INSTALL_DIR:-/usr/local/bin}"

# Detect OS
os=""
case "$(uname -s)" in
    Linux*)     os="linux" ;;
    Darwin*)    os="macos" ;;
    CYGWIN*|MINGW*|MSYS*) os="windows" ;;
    *)          echo "❌ Unsupported OS: $(uname -s)"; exit 1 ;;
esac

# Detect architecture
arch=""
case "$(uname -m)" in
    x86_64|amd64)  arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)             echo "❌ Unsupported architecture: $(uname -m)"; exit 1 ;;
esac

# Windows uses .exe
ext=""
[ "$os" = "windows" ] && ext=".exe"

# macOS x64 fallback to arm64 via Rosetta
if [ "$os" = "macos" ] && [ "$arch" = "x64" ]; then
    if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
        echo "ℹ️  Rosetta detected — using arm64 binary for better performance"
        arch="arm64"
    fi
fi

filename="boxty-${os}-${arch}${ext}"
url="${BASE_URL}/${VERSION}/${filename}"

# If version=latest, also fetch the actual version number
if [ "$VERSION" = "latest" ]; then
    version_info=$(curl -fsSL "${BASE_URL}/version" 2>/dev/null || echo "")
    if [ -n "$version_info" ]; then
        VERSION=$(echo "$version_info" | tr -d '\n')
        echo "📦 Installing Boxty CLI v${VERSION}"
    else
        echo "📦 Installing Boxty CLI (latest)"
    fi
else
    echo "📦 Installing Boxty CLI v${VERSION}"
fi

echo "🔍 Platform: ${os} (${arch})"
echo "⬇️  Downloading from ${url}..."

# Download to temp
tmpdir="$(mktemp -d)"
tmpfile="${tmpdir}/${filename}"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$tmpfile"
elif command -v wget >/dev/null 2>&1; then
    wget -q "$url" -O "$tmpfile"
else
    echo "❌ curl or wget required"
    exit 1
fi

# Verify download
if [ ! -f "$tmpfile" ] || [ ! -s "$tmpfile" ]; then
    echo "❌ Download failed — binary not found at ${url}"
    exit 1
fi

# Verify signature (if cosign.pub available)
if command -v cosign > /dev/null 2>&1; then
    sig_url="${url}.sig"
    pub_key_url="${BASE_URL}/cosign.pub"
    sig_file="${tmpdir}/$(basename "$filename").sig"
    pub_file="${tmpdir}/cosign.pub"
    
    if curl -fsSL "$pub_key_url" -o "$pub_file" 2>/dev/null; then
        if curl -fsSL "$sig_url" -o "$sig_file" 2>/dev/null; then
            if cosign verify-blob --key "$pub_file" --signature "$sig_file" "$tmpfile" 2>/dev/null; then
                echo "✅ Signature verified"
            else
                echo "⚠️  Signature verification failed — continuing anyway"
            fi
        fi
    fi
fi

# Verify checksum (if .sha256 available)
sha_url="${url}.sha256"
sha_file="${tmpdir}/$(basename "$filename").sha256"
if curl -fsSL "$sha_url" -o "$sha_file" 2>/dev/null; then
    expected=$(awk '{print $1}' "$sha_file")
    actual=$(sha256sum "$tmpfile" | awk '{print $1}')
    if [ "$expected" = "$actual" ]; then
        echo "✅ Checksum verified"
    else
        echo "❌ Checksum mismatch! Expected: $expected, Got: $actual"
        exit 1
    fi
fi

# Install
if [ "$os" = "windows" ]; then
    # Windows: install to %LOCALAPPDATA%\bin or C:\bin
    win_dir="${LOCALAPPDATA}\\bin"
    [ -d "$win_dir" ] || win_dir="C:\\bin"
    mkdir -p "$win_dir" 2>/dev/null || true
    mv "$tmpfile" "$win_dir\\boxty.exe"
    echo "✅ Installed to ${win_dir}\\boxty.exe"
    echo "⚠️  Add ${win_dir} to your PATH if not already set"
else
    # Unix: install to /usr/local/bin or ~/.local/bin
    if [ -w "$INSTALL_DIR" ] || [ "$(id -u)" = "0" ]; then
        mv "$tmpfile" "${INSTALL_DIR}/boxty"
        chmod +x "${INSTALL_DIR}/boxty"
        echo "✅ Installed to ${INSTALL_DIR}/boxty"
    else
        # Fallback to ~/.local/bin
        user_bin="${HOME}/.local/bin"
        mkdir -p "$user_bin"
        mv "$tmpfile" "${user_bin}/boxty"
        chmod +x "${user_bin}/boxty"
        echo "✅ Installed to ${user_bin}/boxty"
        echo "⚠️  Add ${user_bin} to your PATH:"
        echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
fi

# Cleanup
rm -rf "$tmpdir"

# Verify
echo ""
if command -v boxty >/dev/null 2>&1; then
    boxty --version
    echo ""
    echo "🎉 Boxty CLI is ready! Run 'boxty --help' to get started."
else
    echo "⚠️  boxty not in PATH — restart your terminal or run:"
    echo "   export PATH=\"${INSTALL_DIR}:\$PATH\""
fi
