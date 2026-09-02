#!/usr/bin/env bash
# build-gentle.sh — sequential low-memory builds for the dshc checkout.
# One package at a time, niced, ~700MB heap, 20s pauses: fits the 1.8GB box
# next to the two running instances. Log: /tmp/dshc-build-gentle.log
set -u
cd /home/arthur/jarvis/dsh-claude
LOG=/tmp/dshc-build-gentle.log
: > "$LOG"
export NODE_OPTIONS='--max-old-space-size=700'

step() {
  local label="$1"; shift
  echo "[$(date +%H:%M:%S)] begin: $label" >> "$LOG"
  if nice -n 15 "$@" >> "$LOG" 2>&1; then
    echo "[$(date +%H:%M:%S)] ok: $label" >> "$LOG"
  else
    echo "[$(date +%H:%M:%S)] FAIL: $label — retrying once with 600MB" >> "$LOG"
    sleep 60
    if NODE_OPTIONS='--max-old-space-size=600' nice -n 15 "$@" >> "$LOG" 2>&1; then
      echo "[$(date +%H:%M:%S)] ok(retry): $label" >> "$LOG"
    else
      echo "[$(date +%H:%M:%S)] FAIL-FINAL: $label" >> "$LOG"
    fi
  fi
  sleep 20
}

step "apps/cli -> lib/bin.js" pnpm --filter @deepseek-ai/dsh exec tsdown
step "ui-theme faces" pnpm --filter @deepseek-ai/dsh-client-ui-theme run bundle
echo "[$(date +%H:%M:%S)] ALL DONE" >> "$LOG"
