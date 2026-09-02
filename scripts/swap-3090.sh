#!/usr/bin/env bash
# swap-3090.sh — put the dshc checkout CLI on port 3090, with automatic
# rollback to the installed stock CLI if the checkout does not answer.
# Detached by design: survives the agent session that launches it.
set -u
LOG=/tmp/dshc-swap3090.log
CHECKOUT=/home/arthur/jarvis/dsh-claude/apps/cli/lib/bin.js
STOCK=/home/arthur/.local/lib/node_modules/@deepseek-ai/dsh/lib/bin.js
WS=/home/arthur/dsh-claude-work
ENVFILE=/home/arthur/.dshc/runtime-env
: > "$LOG"

start() { # $1 = bin, $2 = log
  cd "$WS"
  set -a; [ -f "$ENVFILE" ] && . "$ENVFILE"; set +a
  DSH_HOME=/home/arthur/.dshc setsid nohup node "$1" web --port 3090 --no-open >> "$2" 2>&1 &
}

healthy() {
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3090 --max-time 2 2>/dev/null)" = "200" ]
}

fuser -k 3090/tcp 2>/dev/null || true
sleep 2
echo "[$(date +%H:%M:%S)] launching checkout cli" >> "$LOG"
start "$CHECKOUT" /tmp/dshc-web-checkout.log
for _ in $(seq 1 30); do
  sleep 1
  if healthy; then echo "[$(date +%H:%M:%S)] CHECKOUT ONLINE" >> "$LOG"; exit 0; fi
done

echo "[$(date +%H:%M:%S)] checkout failed — rollback to stock" >> "$LOG"
pkill -f "node $CHECKOUT" 2>/dev/null || true
sleep 2
start "$STOCK" /tmp/dshc-web-stock.log
for _ in $(seq 1 30); do
  sleep 1
  if healthy; then echo "[$(date +%H:%M:%S)] STOCK ONLINE (rollback)" >> "$LOG"; exit 0; fi
done
echo "[$(date +%H:%M:%S)] ROLLBACK ALSO FAILED — manual attention needed" >> "$LOG"
exit 1
