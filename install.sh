#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Boxty Provider Install Script
# One-liner VPS onboarding: auto-detect OS, install deps, download binary,
# create systemd service, configure auto-start.
#
# Usage (run as root or with sudo):
#   curl -fsSL https://install.boxty.dev | bash
#   or
#   wget -qO- https://install.boxty.dev | bash
#
# Options:
#   BOXTY_VERSION  — binary version to install (default: latest)
#   BOXTY_TIER     — tier override: nano|micro|standard|pro|max (default: auto)
#   BOXTY_INSTANCES — number of workers (default: auto)
#   BOXTY_SIGNALING — signaling server address (default: /dns4/signaling.boxty.dev/tcp/4001)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[boxty-install]${NC} $*"; }
warn() { echo -e "${YELLOW}[boxty-install] WARN:${NC} $*"; }
err()  { echo -e "${RED}[boxty-install] ERROR:${NC} $*"; exit 1; }

# ----- Config ---------------------------------------------------------------
BOXTY_VERSION="${BOXTY_VERSION:-latest}"
BOXTY_TIER="${BOXTY_TIER:-}"
BOXTY_INSTANCES="${BOXTY_INSTANCES:-}"
BOXTY_SIGNALING="${BOXTY_SIGNALING:-/dns4/signaling.boxty.dev/tcp/4001/p2p/QmSignalingServer1234567890}"
BOXTY_HOME="/opt/boxty"
BOXTY_BIN="${BOXTY_HOME}/boxty"
INSTALL_USER="${SUDO_USER:-$(whoami)}"

# ----- Require root ---------------------------------------------------------
if [[ "$(id -u)" -ne 0 ]]; then
    err "This script must be run as root (use sudo)."
fi

log "Boxty Provider Installer"
log "========================="
log ""

# ----- OS Detection ---------------------------------------------------------
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_NAME="${ID}"
        OS_VERSION="${VERSION_ID:-}"
    elif [[ "$(uname -s)" == "Darwin" ]]; then
        OS_NAME="macos"
        OS_VERSION="$(sw_vers -productVersion 2>/dev/null || echo 'unknown')"
    else
        OS_NAME="unknown"
    fi
    log "Detected OS: ${OS_NAME} ${OS_VERSION}"
}

detect_os

# ----- Install dependencies -------------------------------------------------
install_deps() {
    case "${OS_NAME}" in
        ubuntu|debian)
            log "Installing system dependencies (apt)..."
            apt-get update -qq
            apt-get install -y -qq curl ca-certificates systemd 2>/dev/null || true
            ;;
        fedora|rhel|centos|rocky|almalinux)
            log "Installing system dependencies (dnf/yum)..."
            if command -v dnf &>/dev/null; then
                dnf install -y curl ca-certificates systemd 2>/dev/null || true
            else
                yum install -y curl ca-certificates systemd 2>/dev/null || true
            fi
            ;;
        arch)
            log "Installing system dependencies (pacman)..."
            pacman -Sy --noconfirm curl ca-certificates 2>/dev/null || true
            ;;
        macos)
            log "macOS detected — skipping system package install."
            log "  Install via Homebrew: brew install boxty"
            return
            ;;
        *)
            warn "Unknown OS '${OS_NAME}' — skipping system package install."
            warn "You may need to install curl and ca-certificates manually."
            ;;
    esac
}

install_deps

# ----- Download binary ------------------------------------------------------
download_binary() {
    local arch
    arch="$(uname -m)"
    local os
    case "$(uname -s)" in
        Linux)  os="linux" ;;
        Darwin) os="darwin" ;;
        *)      err "Unsupported OS: $(uname -s)" ;;
    esac

    case "${arch}" in
        x86_64)  arch="amd64" ;;
        aarch64) arch="arm64" ;;
        arm64)   arch="arm64" ;;
        *)       err "Unsupported architecture: ${arch}" ;;
    esac

    local url
    if [[ "${BOXTY_VERSION}" == "latest" ]]; then
        url="https://releases.boxty.dev/latest/boxty-${os}-${arch}"
    else
        url="https://releases.boxty.dev/${BOXTY_VERSION}/boxty-${os}-${arch}"
    fi

    log "Downloading Boxty binary..."
    log "  URL: ${url}"

    mkdir -p "${BOXTY_HOME}"

    if curl -fsSL --retry 3 --retry-delay 2 -o "${BOXTY_BIN}" "${url}"; then
        chmod +x "${BOXTY_BIN}"
        log "Binary installed to ${BOXTY_BIN}"
    else
        warn "Could not download pre-built binary from ${url}"
        warn "Falling back to building from source with cargo..."
        build_from_source
    fi
}

build_from_source() {
    if ! command -v cargo &>/dev/null; then
        log "Installing Rust toolchain..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        # shellcheck disable=SC1091
        source "${HOME}/.cargo/env"
    fi
    log "Building boxty from source..."
    cargo install boxty --root "${BOXTY_HOME}"
    log "Binary installed to ${BOXTY_BIN}"
}

download_binary

# ----- Initialize provider (auto-detect resources) --------------------------
init_provider() {
    log "Initializing Boxty provider..."

    local tier_arg=""
    if [[ -n "${BOXTY_TIER}" ]]; then
        tier_arg="--tier ${BOXTY_TIER}"
    fi

    local instances_arg=""
    if [[ -n "${BOXTY_INSTANCES}" ]]; then
        instances_arg="--instances ${BOXTY_INSTANCES}"
    fi

    # Run boxty once briefly to generate wallet and show detected resources
    log "Running: ${BOXTY_BIN} provider ${tier_arg} ${instances_arg} --signaling ${BOXTY_SIGNALING}"
    log ""

    # Run in background briefly to init state, then kill
    timeout 10 "${BOXTY_BIN}" provider ${tier_arg} ${instances_arg} --signaling "${BOXTY_SIGNALING}" 2>&1 || true
}

# ----- Create systemd service (Linux only) ----------------------------------
create_systemd_service() {
    if [[ "${OS_NAME}" == "macos" ]]; then
        log "macOS detected — creating LaunchAgent plist instead..."

        local plist_path="/Library/LaunchDaemons/dev.boxty.provider.plist"
        local tier_arg=""
        [[ -n "${BOXTY_TIER}" ]] && tier_arg="--tier ${BOXTY_TIER}"
        local instances_arg=""
        [[ -n "${BOXTY_INSTANCES}" ]] && instances_arg="--instances ${BOXTY_INSTANCES}"

        cat > "${plist_path}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.boxty.provider</string>
    <key>ProgramArguments</key>
    <array>
        <string>${BOXTY_BIN}</string>
        <string>provider</string>
        ${tier_arg:+"<string>--tier</string><string>${BOXTY_TIER}</string>"}
        ${instances_arg:+"<string>--instances</string><string>${BOXTY_INSTANCES}</string>"}
        <string>--signaling</string>
        <string>${BOXTY_SIGNALING}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/boxty-provider.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/boxty-provider.log</string>
</dict>
</plist>
PLIST

        launchctl load -w "${plist_path}" 2>/dev/null || true
        log "LaunchAgent installed at ${plist_path}"
        return
    fi

    log "Creating systemd service..."

    local tier_arg=""
    [[ -n "${BOXTY_TIER}" ]] && tier_arg="--tier ${BOXTY_TIER}"
    local instances_arg=""
    [[ -n "${BOXTY_INSTANCES}" ]] && instances_arg="--instances ${BOXTY_INSTANCES}"

    cat > /etc/systemd/system/boxty-provider.service <<SERVICE
[Unit]
Description=Boxty Provider — P2P Compute Node
After=network.target

[Service]
Type=simple
User=${INSTALL_USER}
ExecStart=${BOXTY_BIN} provider ${tier_arg} ${instances_arg} --signaling ${BOXTY_SIGNALING}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=BOXTY_HOME=${BOXTY_HOME}
Environment=RUST_LOG=info

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=${BOXTY_HOME}
ReadOnlyPaths=/

[Install]
WantedBy=multi-user.target
SERVICE

    systemctl daemon-reload
    systemctl enable boxty-provider
    systemctl start boxty-provider

    log "Systemd service installed and started!"
    log "  Status:  systemctl status boxty-provider"
    log "  Logs:    journalctl -u boxty-provider -f"
}

create_systemd_service

# ----- Display wallet info --------------------------------------------------
show_wallet() {
    log ""
    log "============================================================"
    log "  Boxty Provider is now running!"
    log "============================================================"

    # Wait a moment for the wallet file to be created
    sleep 2

    local wallet_file="${BOXTY_HOME}/.boxty/wallet.json"
    if [[ -f "${HOME}/.boxty/wallet.json" ]]; then
        wallet_file="${HOME}/.boxty/wallet.json"
    fi

    if [[ -f "${wallet_file}" ]]; then
        local wallet_addr
        wallet_addr="$(python3 -c "import json; print(json.load(open('${wallet_file}'))['address'])" 2>/dev/null || \
                       grep -o '"address":"[^"]*"' "${wallet_file}" | cut -d'"' -f4)"

        if [[ -n "${wallet_addr}" ]]; then
            log ""
            log "  🪪  Wallet Address:"
            log "     ${wallet_addr}"
            log ""
            log "  This is where your earnings will be deposited."
            log "  Share this address with clients or add it to your profile."
            log ""
        fi
    fi

    log "  Monitor your node:"
    log "    boxty gateway          # Start local dashboard"
    log "    curl http://localhost:8080/api/provider/metrics"
    log ""
    log "  Earnings are settled on-chain via Solana to your wallet."
    log "============================================================"
}

show_wallet

log "Installation complete! 🚀"
