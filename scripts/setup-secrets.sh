#!/bin/bash
# Boxty Secret Manager — populates GitHub Secrets from CLI
# Usage: ./scripts/setup-secrets.sh
# Requires: gh CLI authenticated, repo owner access

set -e

REPO="${1:-adriantucicovenco/boxty}"
ENV_FILE="${2:-.env}"

echo "🔐 Boxty Secret Setup for ${REPO}"
echo ""

# Check gh auth
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ gh CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Helper to set secret
set_secret() {
    local name="$1"
    local value="$2"
    if [ -z "$value" ]; then
        echo "⚠️  Skipping ${name} (empty value)"
        return
    fi
    echo "🔑 Setting ${name}..."
    gh secret set "$name" --repo "$REPO" --body "$value" >/dev/null 2>&1
    echo "   ✅ ${name}"
}

# Read from .env if provided
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading secrets from ${ENV_FILE}"
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue
        # Trim whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        set_secret "$key" "$value"
    done < "$ENV_FILE"
else
    echo "📝 Interactive mode — enter secrets (Ctrl+D when done):"
    echo ""
    
    # PyPI
    read -rp "PYPI_API_TOKEN: " PYPI_API_TOKEN
    set_secret "PYPI_API_TOKEN" "$PYPI_API_TOKEN"
    
    # NPM
    read -rp "NPM_TOKEN: " NPM_TOKEN
    set_secret "NPM_TOKEN" "$NPM_TOKEN"
    
    # Cloudflare
    read -rp "CLOUDFLARE_API_TOKEN: " CLOUDFLARE_API_TOKEN
    set_secret "CLOUDFLARE_API_TOKEN" "$CLOUDFLARE_API_TOKEN"
    
    read -rp "CLOUDFLARE_ACCOUNT_ID: " CLOUDFLARE_ACCOUNT_ID
    set_secret "CLOUDFLARE_ACCOUNT_ID" "$CLOUDFLARE_ACCOUNT_ID"
    
    read -rp "CLOUDFLARE_PAGES_PROJECT: " CLOUDFLARE_PAGES_PROJECT
    set_secret "CLOUDFLARE_PAGES_PROJECT" "$CLOUDFLARE_PAGES_PROJECT"
    
    # R2
    read -rp "R2_ACCESS_KEY_ID: " R2_ACCESS_KEY_ID
    set_secret "R2_ACCESS_KEY_ID" "$R2_ACCESS_KEY_ID"
    
    read -rp "R2_SECRET_ACCESS_KEY: " R2_SECRET_ACCESS_KEY
    set_secret "R2_SECRET_ACCESS_KEY" "$R2_SECRET_ACCESS_KEY"
    
    read -rp "R2_ENDPOINT_URL (e.g., https://xxx.r2.cloudflarestorage.com): " R2_ENDPOINT_URL
    set_secret "R2_ENDPOINT_URL" "$R2_ENDPOINT_URL"
    
    read -rp "R2_BUCKET: " R2_BUCKET
    set_secret "R2_BUCKET" "$R2_BUCKET"
    
    # Ansible / VPS
    read -rp "VPS_SSH_KEY (private key content): " VPS_SSH_KEY
    set_secret "VPS_SSH_KEY" "$VPS_SSH_KEY"
    
    read -rp "ANSIBLE_VAULT_PASSWORD (optional): " ANSIBLE_VAULT_PASSWORD
    set_secret "ANSIBLE_VAULT_PASSWORD" "$ANSIBLE_VAULT_PASSWORD"
fi

echo ""
echo "✅ All secrets configured!"
echo ""
echo "Verify with: gh secret list --repo ${REPO}"
