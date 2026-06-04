#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Obtinem token-ul din hermes .env
if [ -f "$HOME/.hermes/.env" ]; then
  export $(grep -v '^#' "$HOME/.hermes/.env" | grep GITHUB_TOKEN | xargs)
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Nu am putut obtine token-ul. Adauga GITHUB_TOKEN in ~/.hermes/.env."
  exit 1
fi

echo "Token obtinut ($(echo $GITHUB_TOKEN | head -c 10)...)"

mkdir -p .hermes-logs

# Generam master prompt cu token-ul deja inlocuit direct in bash commands
sed "s|__GH_TOKEN__|$GITHUB_TOKEN|g" .hermes-prompts/master-boxty.txt > /tmp/boxty-master-injected.txt

echo "Prompt generat. Lansez Hermes..."
echo "Log: .hermes-logs/boxty-build.log"
echo ""

hermes chat --yolo < /tmp/boxty-master-injected.txt 2>&1 | tee .hermes-logs/boxty-build.log

rm -f /tmp/boxty-master-injected.txt
