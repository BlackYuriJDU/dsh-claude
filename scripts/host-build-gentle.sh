#!/usr/bin/env bash
# host-build-gentle.sh — build the checkout's missing host faces leaf-first.
# Rounds of per-package `tsc -b` (small graphs, cached deps skipped), then one
# root `tsdown --env.DSH_BUILD_FACE host` to bundle every lib/index.js from the
# emitted lib/types. Niced, ~700MB heap, 15s pauses: coexists with the two
# running instances on the 1.8GB box. Log: /tmp/dshc-host-build.log
set -u
cd /home/arthur/jarvis/dsh-claude
LOG=/tmp/dshc-host-build.log
: > "$LOG"
export NODE_OPTIONS='--max-old-space-size=700'
export ESBUILD_WORKER_THREADS=1

missing() {
  for f in $(find packages apps -maxdepth 3 -name package.json -not -path '*/node_modules/*' 2>/dev/null); do
    d=$(dirname "$f")
    name=$(grep -m1 '"name"' "$f" | cut -d'"' -f4)
    case "$name" in
      @deepseek-ai/*) [ -f "$d/lib/index.js" ] || echo "$d" ;;
    esac
  done
}

for pass in 1 2 3 4 5 6 7 8; do
  mapfile -t dirs < <(missing | sort -r)
  if [ "${#dirs[@]}" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] pass $pass: nothing missing" >> "$LOG"
    break
  fi
  echo "[$(date +%H:%M:%S)] pass $pass: ${#dirs[@]} package(s) without lib/index.js" >> "$LOG"
  for d in "${dirs[@]}"; do
    if [ ! -f "$d/lib/types/index.js" ]; then
      echo "[$(date +%H:%M:%S)] tsc -b $d" >> "$LOG"
      nice -n 15 node_modules/.bin/tsc -b "$d" >> "$LOG" 2>&1 \
        && echo "[$(date +%H:%M:%S)]   tsc ok" >> "$LOG" \
        || { echo "[$(date +%H:%M:%S)]   tsc FAIL (retry next pass)" >> "$LOG"; sleep 15; continue; }
      sleep 15
    fi
  done
done

echo "[$(date +%H:%M:%S)] root tsdown host face" >> "$LOG"
nice -n 15 node_modules/.bin/tsdown --env.DSH_BUILD_FACE host >> "$LOG" 2>&1 \
  && echo "[$(date +%H:%M:%S)] HOST BUILD DONE" >> "$LOG" \
  || echo "[$(date +%H:%M:%S)] HOST BUILD FAILED at tsdown" >> "$LOG"
