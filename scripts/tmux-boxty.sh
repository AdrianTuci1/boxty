#!/bin/bash
set -euo pipefail

if [ $# -ge 1 ]; then
  export GITHUB_TOKEN="$1"
  echo "Using provided token"
else
  export GITHUB_TOKEN=$(gh auth token 2>/dev/null)
  if [ -z "$GITHUB_TOKEN" ]; then
    echo "Nu am putut obtine token-ul. Ruleaza 'gh auth login' mai intai."
    echo "   Sau: $0 <GITHUB_TOKEN>"
    exit 1
  fi
  echo "Using gh auth token"
fi

SESSION="boxty"
PROMPTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/.hermes-prompts"
LOGS_DIR="$(cd "$(dirname "$0")/.." && pwd)/.hermes-logs"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "$LOGS_DIR" && mkdir -p "$LOGS_DIR"
tmux kill-session -t "$SESSION" 2>/dev/null || true

tmux new-session -d -s "$SESSION" -x 240 -y 80
tmux rename-window -t "$SESSION:0" "boxty-build"

# Split: left 55% master, right 45% coordinator
tmux split-window -h -p 45 -t "$SESSION:0.0"

tmux select-pane -t "$SESSION:0.0" -T "MASTER (steer)"
tmux select-pane -t "$SESSION:0.1" -T "COORDINATOR"

tmux set-window-option -t "$SESSION:0" synchronize-panes off

# ---- Pane 0: MASTER (steer + progress) ----
MASTER_PROMPT="$PROMPTS_DIR/master-boxty.txt"
LOG_FILE="$LOGS_DIR/boxty-build.log"

tmux send-keys -t "$SESSION:0.0" \
  "cd $REPO_DIR && clear" Enter
tmux send-keys -t "$SESSION:0.0" \
  "echo 'BOXTY — 8 agenti (A1-A8) in 2 batch-uri' && echo ''" Enter
tmux send-keys -t "$SESSION:0.0" \
  "hermes chat -t terminal,file --yolo 2>&1 | tee '$LOG_FILE'" Enter

# Auto-paste master prompt after hermes starts
(
  sleep 10
  tmux load-buffer -b "boxty-master" "$MASTER_PROMPT"
  tmux paste-buffer -t "$SESSION:0.0" -b "boxty-master"
  tmux send-keys -t "$SESSION:0.0" Enter
  echo "[$(date '+%H:%M:%S')] Auto-pasted boxty master prompt" >> "$LOGS_DIR/orchestrator.log"
) &

# ---- Pane 1: COORDINATOR ----
tmux send-keys -t "$SESSION:0.1" "cd $REPO_DIR && clear" Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "BOXTY — BUILD COMPLET" && echo ""' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  Batch1: A1-api  A2-worker  A3-sdk-py (3 paralel)"' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  Batch2: A4-sdk-js  A5-infra  A6-web (3 paralel)"' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  Batch3: A7-docs  A8-ci (2 paralel)"' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  Merge + validare → boxty/release" && echo ""' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  steer in panoul MASTER (stanga) — Ctrl+b sageata stanga" && echo ""' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  tail -f .hermes-logs/boxty-build.log       # tot log-ul live"' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  git --no-pager log --oneline -5              # ultimele commit-uri"' Enter
tmux send-keys -t "$SESSION:0.1" \
  'echo "  Ctrl+b z = zoom pane   Ctrl+b d = detach (nu opreste)"' Enter

tmux select-pane -t "$SESSION:0.0"

echo ""
echo "  Boxty — 8 agenti (A1-A8) in 3 batch-uri"
echo "  ========================================"
echo ""
echo "  Local — fara sandbox remote (max 3 paralel, 16GB RAM)"
echo ""
echo "  +------------------------------------------+------------------------------------------+"
echo "  | MASTER (steer + progress) ~55%           | COORDINATOR (comenzi, log) ~45%          |"
echo "  | hermes chat --yolo                        | tail -f .hermes-logs/boxty-build.log     |"
echo "  | Batch1: A1-api  A2-worker  A3-sdk-py (3)  | git --no-pager log --oneline -5           |"
echo "  | Batch2: A4-sdk-js  A5-infra  A6-web (3)  | Ctrl+b z = zoom   d = detach            |"
echo "  | Batch3: A7-docs  A8-ci (2)               |                                          |"
echo "  | Merge → boxty/release                     |                                          |"
echo "  +------------------------------------------+------------------------------------------+"
echo ""
echo "  Attach:  tmux attach -t $SESSION"
echo "  Navig:   Ctrl+b + sageata stanga/dreapta"
echo "  Steer:   scrie in panoul MASTER (stanga)"
echo ""
echo "  Prompt-ul se auto-pasteaza dupa ~10s"
echo ""
