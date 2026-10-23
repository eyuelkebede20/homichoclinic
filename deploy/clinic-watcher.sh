#!/usr/bin/env bash
# ============================================================
#  deploy/clinic-watcher.sh
#  Linux equivalent of deploy\clinic-watcher.bat
#
#  Watches for run/update.request created when the admin clicks
#  "Pull Latest Updates" in the web UI, executes update.sh,
#  and writes logs to run/watcher.log.
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
cd "$ROOT" || exit 1

FLAG="$ROOT/run/update.request"
LOG="$ROOT/run/watcher.log"

mkdir -p "$ROOT/run"
chmod 777 "$ROOT/run" 2>/dev/null || true

echo "[$(date '+%F %T')] Clinic watcher started (PID $$)" >> "$LOG"

trap 'echo "[$(date "+%F %T")] Clinic watcher stopping." >> "$LOG"; exit 0' INT TERM

while true; do
  if [ -f "$FLAG" ]; then
    echo "[$(date '+%F %T')] Update request detected." >> "$LOG"
    rm -f "$FLAG" 2>/dev/null || true
    
    if [ -f "$ROOT/update.sh" ]; then
      /bin/bash "$ROOT/update.sh" >> "$LOG" 2>&1
      RC=$?
      echo "[$(date '+%F %T')] update.sh finished (exit code $RC)." >> "$LOG"
    elif [ -f "$ROOT/start.sh" ]; then
      git stash --include-untracked >> "$ROOT/run/update.status" 2>&1 || git stash >> "$ROOT/run/update.status" 2>&1 || true
      /bin/bash "$ROOT/start.sh" --quick --no-color 2>&1 | tee -a "$ROOT/run/update.status" >> "$LOG"
      RC=${PIPESTATUS[0]}
      echo "[$(date '+%F %T')] start.sh --quick finished (exit code $RC)." >> "$LOG"
    else
      echo "[$(date '+%F %T')] ERROR: Neither update.sh nor start.sh found." >> "$LOG"
      echo "[!] ERROR: Neither update.sh nor start.sh found on host." >> "$ROOT/run/update.status" 2>/dev/null || true
    fi
  fi
  sleep 3
done
