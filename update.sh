#!/usr/bin/env bash
# ============================================================
#  update.sh  -  Update script for Bure Clinic
#
#  Called by the systemd watcher (clinic-update.path),
#  deploy/clinic-watcher.sh, or the admin "System Update" button
#  in the web UI.
#
#  Stashes any local changes and executes ./start.sh --quick
#  with real-time progress logging to run/update.status.
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
cd "$ROOT"

STATUS_FILE="run/update.status"
mkdir -p run backups logs
echo "" > "$STATUS_FILE"
chmod 666 "$STATUS_FILE" 2>/dev/null || true

status() {
    local msg="[$(date +%T)] $1"
    echo "$msg"
    echo "$msg" >> "$STATUS_FILE"
}

status "=== Update started ==="

# Stash any local changes first so git pull never has conflicts
status "[1/4] Stashing local changes (if any)..."
git config --global --add safe.directory "$ROOT" 2>/dev/null || true
git stash --include-untracked >> "$STATUS_FILE" 2>&1 || git stash >> "$STATUS_FILE" 2>&1 || true

# Execute start.sh --quick and mirror output to STATUS_FILE
status "[2/4] Starting ./start.sh --quick..."
if [ -f "$ROOT/start.sh" ]; then
    chmod +x "$ROOT/start.sh" 2>/dev/null || true
    /bin/bash "$ROOT/start.sh" --quick --no-color 2>&1 | tee -a "$STATUS_FILE"
    RC=${PIPESTATUS[0]}
    
    if [ "$RC" -eq 0 ]; then
        status "✓. Update complete"
        exit 0
    else
        status "!! Rollback complete"
        exit 1
    fi
else
    status "ERROR: start.sh not found in $ROOT"
    exit 1
fi