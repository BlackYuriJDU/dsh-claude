#!/usr/bin/env bash
# client-build-gentle.sh — rebuild the fork's changed client faces, one at a
# time, niced, ~700MB heap, 15s pauses. Log: /tmp/dshc-client-build.log
set -u
cd /home/arthur/jarvis/dsh-claude
LOG=/tmp/dshc-client-build.log
: > "$LOG"
export NODE_OPTIONS='--max-old-space-size=700'

step() {
  echo "[$(date +%H:%M:%S)] begin: $1" >> "$LOG"
  if nice -n 15 pnpm --filter "$1" run bundle >> "$LOG" 2>&1; then
    echo "[$(date +%H:%M:%S)] ok: $1" >> "$LOG"
  else
    echo "[$(date +%H:%M:%S)] FAIL: $1" >> "$LOG"
  fi
  sleep 15
}

step @deepseek-ai/dsh-client-ui-primitives
step @deepseek-ai/dsh-client-ui-theme
step @deepseek-ai/dsh-client-ui-conversation
step @deepseek-ai/dsh-client-ui-brand-official
step @deepseek-ai/dsh-client-ui-sidebar
step @deepseek-ai/dsh-client-ui-renderer
step @deepseek-ai/dsh-client-ui-settings-models
echo "[$(date +%H:%M:%S)] CLIENT BUILD DONE" >> "$LOG"
