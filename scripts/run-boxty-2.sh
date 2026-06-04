#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Cleanup la iesire
INJECTED="/tmp/boxty-master-2-$$.txt"
trap "rm -f $INJECTED" EXIT

# Obtinem token-ul din hermes .env
if [ -f "$HOME/.hermes/.env" ]; then
  export $(grep -v '^#' "$HOME/.hermes/.env" | grep GITHUB_TOKEN | xargs)
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Nu am putut obtine token-ul. Adauga GITHUB_TOKEN in ~/.hermes/.env."
  exit 1
fi

echo "Token obtinut ($(echo $GITHUB_TOKEN | head -c 10)...)"

# Curatam orice fisier injectat vechi
rm -f /tmp/boxty-master-2-*.txt

# Generam master prompt
sed "s|__GH_TOKEN__|$GITHUB_TOKEN|g" hermes/run-2/master-fill.txt > "$INJECTED"

# Verificare
if ! grep -q "$GITHUB_TOKEN" "$INJECTED"; then
  echo "ERROR: Token-ul nu a fost injectat in prompt!"
  exit 1
fi

echo "Prompt generat cu token verificat (${GITHUB_TOKEN:0:10}...). Lansez Hermes..."
echo ""

hermes chat --yolo < "$INJECTED"
