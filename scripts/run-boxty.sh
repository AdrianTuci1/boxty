#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Obtinem token-ul
export GH_TOKEN=$(gh auth token 2>/dev/null)
if [ -z "$GH_TOKEN" ]; then
  echo "Nu am putut obtine token-ul. Ruleaza 'gh auth login' mai intai."
  exit 1
fi

echo "Token obtinut ($(echo $GH_TOKEN | head -c 10)...)"

mkdir -p .hermes-logs

# Generam master prompt cu token-ul deja inlocuit direct in bash commands
sed "s|__GH_TOKEN__|$GH_TOKEN|g" .hermes-prompts/master-boxty.txt > /tmp/boxty-master-injected.txt

echo "Prompt generat. Lansez Hermes..."
echo "Log: .hermes-logs/boxty-build.log"
echo ""

hermes chat --yolo < /tmp/boxty-master-injected.txt 2>&1 | tee .hermes-logs/boxty-build.log

rm -f /tmp/boxty-master-injected.txt
