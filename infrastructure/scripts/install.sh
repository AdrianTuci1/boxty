#!/usr/bin/env sh
# Boxty CLI installer
# Usage: curl -fsSL https://cli.boxty.dev/install.sh | sh
#        curl -fsSL https://cli.boxty.dev/install.sh | VERSION=1.2.3 sh

set -eu

REPO="AdrianTuci1/boxty"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
VERSION="${VERSION:-latest}"
BASE_URL="${BASE_URL:-https://cli.boxty.dev}"

# Detect platform
_detect_platform() {
  _os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  _arch="$(uname -m)"

  case "$_os" in
    linux) _os="linux" ;;
    darwin) _os="macos" ;;
    *) echo "Unsupported OS: $_os"; exit 1 ;;
  esac

  case "$_arch" in
    x86_64|amd64) _arch="x64" ;;
    aarch64|arm64) _arch="arm64" ;;
    *) echo "Unsupported architecture: $_arch"; exit 1 ;;
  esac

  echo "boxty-${_os}-${_arch}"
}

_download() {
  _url="$1"
  _dst="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then
    wget -q "$1" -O "$2"
  else
    echo "curl or wget is required"
    exit 1
  fi
}

main() {
  _bin="$(_detect_platform)"

  if [ "$VERSION" = "latest" ]; then
    _url="${BASE_URL}/cli/latest/${_bin}"
  else
    _url="${BASE_URL}/cli/${VERSION}/${_bin}"
  fi

  _tmp="$(mktemp -d)"
  trap 'rm -rf "$_tmp"' EXIT

  echo "Downloading Boxty CLI ${_bin} (version: ${VERSION})..."
  _download "$_url" "${_tmp}/${_bin}"

  # Verify checksum if available
  if _download "${_url}.sha256" "${_tmp}/${_bin}.sha256" 2>/dev/null; then
    (
      cd "$_tmp"
      if command -v sha256sum >/dev/null 2>&1; then
        sha256sum -c "${_bin}.sha256"
      elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 -c "${_bin}.sha256"
      fi
    )
  fi

  chmod +x "${_tmp}/${_bin}"

  echo "Installing to ${INSTALL_DIR} (may require sudo)..."
  mkdir -p "$INSTALL_DIR"
  mv "${_tmp}/${_bin}" "${INSTALL_DIR}/boxty"

  if command -v boxty >/dev/null 2>&1; then
    echo "Boxty CLI installed: $(command -v boxty)"
    boxty --version
  else
    echo "Boxty CLI installed to ${INSTALL_DIR}/boxty"
    echo "Add ${INSTALL_DIR} to your PATH to use it."
  fi
}

main
