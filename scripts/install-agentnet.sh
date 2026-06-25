#!/bin/sh

set -eu

PUBLIC_BASE_URL="__R2_PUBLIC_BASE_URL__"
DEFAULT_RELEASE_PREFIX="agentnet/releases"
RELEASE_PREFIX="${RELEASE_PREFIX:-$DEFAULT_RELEASE_PREFIX}"
VERSION="${VERSION:-latest}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

fail() {
  printf '%s\n' "error: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

fetch() {
  url="$1"
  dest="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$dest"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "$dest" "$url"
    return
  fi

  fail "curl or wget is required"
}

detect_platform() {
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux) os_slug="linux" ;;
    Darwin) os_slug="darwin" ;;
    *) fail "unsupported operating system: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64) arch_slug="x86_64" ;;
    arm64|aarch64) arch_slug="aarch64" ;;
    *) fail "unsupported architecture: $arch" ;;
  esac

  PLATFORM="${os_slug}-${arch_slug}"
}

manifest_url() {
  if [ "$VERSION" = "latest" ]; then
    printf '%s/%s/latest.json' "$PUBLIC_BASE_URL" "$RELEASE_PREFIX"
  else
    printf '%s/%s/v%s/manifest.json' "$PUBLIC_BASE_URL" "$RELEASE_PREFIX" "$VERSION"
  fi
}

extract_json_string() {
  key="$1"
  file="$2"
  python3 - "$key" "$file" <<'PY'
import json
import sys

key = sys.argv[1]
path = sys.argv[2]

with open(path, "r", encoding="utf-8") as fh:
    payload = json.load(fh)

value = payload
for part in key.split("."):
    if isinstance(value, dict):
        value = value.get(part)
    else:
        value = None
        break

if value is None:
    sys.exit(1)

print(value)
PY
}

resolve_asset() {
  manifest="$1"
  python3 - "$manifest" "$PLATFORM" <<'PY'
import json
import sys

path = sys.argv[1]
platform = sys.argv[2]

with open(path, "r", encoding="utf-8") as fh:
    payload = json.load(fh)

for asset in payload.get("assets", []):
    if asset.get("platform") == platform:
        print(asset["url"])
        print(asset["sha256"])
        print(asset["name"])
        break
else:
    sys.exit(1)
PY
}

verify_checksum() {
  archive="$1"
  expected="$2"

  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$archive" | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
  else
    fail "sha256sum or shasum is required"
  fi

  [ "$actual" = "$expected" ] || fail "checksum mismatch for $(basename "$archive")"
}

main() {
  need_cmd uname
  need_cmd mkdir
  need_cmd tar
  need_cmd python3

  [ -n "$PUBLIC_BASE_URL" ] || fail "installer is missing a public base URL"

  detect_platform

  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT INT TERM

  manifest_path="$tmpdir/manifest.json"
  fetch "$(manifest_url)" "$manifest_path"

  resolved_version="$(extract_json_string version "$manifest_path")" || fail "failed to resolve release version"

  asset_info="$(resolve_asset "$manifest_path")" || fail "no asset published for platform ${PLATFORM}"
  asset_url="$(printf '%s\n' "$asset_info" | sed -n '1p')"
  asset_sha256="$(printf '%s\n' "$asset_info" | sed -n '2p')"
  asset_name="$(printf '%s\n' "$asset_info" | sed -n '3p')"

  archive_path="$tmpdir/$asset_name"
  fetch "$asset_url" "$archive_path"
  verify_checksum "$archive_path" "$asset_sha256"

  extract_dir="$tmpdir/extract"
  mkdir -p "$extract_dir"
  tar -xzf "$archive_path" -C "$extract_dir"

  binary_path="$(find "$extract_dir" -type f -name boxty | head -n 1)"
  [ -n "$binary_path" ] || fail "boxty binary not found in archive"

  mkdir -p "$INSTALL_DIR"
  install_target="$INSTALL_DIR/boxty"
  cp "$binary_path" "$install_target"
  chmod +x "$install_target"

  printf '%s\n' "Installed boxty ${resolved_version} to ${install_target}"

  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      printf '%s\n' ""
      printf '%s\n' "Add this directory to your PATH if needed:"
      printf '%s\n' "  export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
  esac
}

main "$@"
