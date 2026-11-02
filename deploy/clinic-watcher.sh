#!/usr/bin/env bash
# ============================================================
#  deploy/clinic-watcher.sh
#  Self-healing update watcher daemon for Bure Clinic
#
#  Watches for run/update.request created when the admin clicks
#  "Pull Latest Updates" in the web UI, executes update.sh,
#  and writes logs to run/watcher.log.
#
#  Commands:
#    ./deploy/clinic-watcher.sh            # Run in foreground (used by systemd)
#    ./deploy/clinic-watcher.sh --daemon   # Run in background (nohup + disown)
#    ./deploy/clinic-watcher.sh --status   # Check if watcher is currently running
#    ./deploy/clinic-watcher.sh --stop     # Stop running instance
#    ./deploy/clinic-watcher.sh --restart  # Restart running instance
#    ./deploy/clinic-watcher.sh --watchdog # Healthcheck for cron (starts if dead)
# ============================================================

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
cd "$ROOT" || exit 1

FLAG="$ROOT/run/update.request"
LOG="$ROOT/run/watcher.log"
PIDFILE="$ROOT/run/clinic-watcher.pid"
STATUS_FILE="$ROOT/run/update.status"

mkdir -p "$ROOT/run" "$ROOT/logs" "$ROOT/backups"
chmod 777 "$ROOT/run" 2>/dev/null || true

# ------------------------------------------------------------
#  Helper: Check if existing PID is running
# ------------------------------------------------------------
is_running() {
  if [ -f "$PIDFILE" ]; then
    local pid
    pid="$(tr -d ' \r\n' < "$PIDFILE" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      # Verify it's not a reused unrelated PID
      if [ -d "/proc/$pid" ]; then
        if grep -qi "clinic-watcher" "/proc/$pid/cmdline" 2>/dev/null; then
          echo "$pid"
          return 0
        fi
      else
        # BSD / macOS / fallback without /proc
        if ps -p "$pid" -o args= 2>/dev/null | grep -qi "clinic-watcher"; then
          echo "$pid"
          return 0
        fi
      fi
    fi
    # If we reached here, PID is stale
    rm -f "$PIDFILE" 2>/dev/null || true
  fi
  return 1
}

# ------------------------------------------------------------
#  Log rotation helper (caps log at ~5 MB)
# ------------------------------------------------------------
rotate_log_if_needed() {
  if [ -f "$LOG" ]; then
    local size
    size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
    if [ "$size" -gt 5242880 ]; then
      local tmp_log
      tmp_log="$(mktemp 2>/dev/null || echo "$LOG.tmp")"
      tail -n 2500 "$LOG" > "$tmp_log" 2>/dev/null && mv -f "$tmp_log" "$LOG" 2>/dev/null || true
      rm -f "$tmp_log" 2>/dev/null || true
    fi
  fi
}

# ------------------------------------------------------------
#  CLI Commands
# ------------------------------------------------------------
ACTION="${1:-}"

case "$ACTION" in
  --status)
    if running_pid=$(is_running); then
      echo "  [OK] Clinic watcher is ACTIVE (PID $running_pid)."
      if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
        if systemctl is-active --quiet clinic-watcher.service 2>/dev/null; then
          echo "       Managed by systemd: clinic-watcher.service (active)"
        fi
      fi
      exit 0
    else
      echo "  [!] Clinic watcher is NOT running."
      exit 1
    fi
    ;;

  --stop)
    if running_pid=$(is_running); then
      echo "  [..] Stopping clinic watcher (PID $running_pid)..."
      kill -TERM "$running_pid" 2>/dev/null || true
      for _ in {1..10}; do
        if ! kill -0 "$running_pid" 2>/dev/null; then
          break
        fi
        sleep 0.5
      done
      if kill -0 "$running_pid" 2>/dev/null; then
        echo "  [!] Force killing PID $running_pid..."
        kill -9 "$running_pid" 2>/dev/null || true
      fi
      rm -f "$PIDFILE" 2>/dev/null || true
      echo "  [OK] Clinic watcher stopped."
    else
      echo "  Clinic watcher is not running."
    fi
    if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
      sudo systemctl stop clinic-watcher.service 2>/dev/null || true
    fi
    exit 0
    ;;

  --restart)
    "$0" --stop
    sleep 1
    "$0" --daemon
    exit $?
    ;;

  --watchdog)
    # Cron health check: If running, exit silently 0. If dead, restart it.
    if running_pid=$(is_running); then
      exit 0
    fi
    # If systemd is supposed to manage it, try systemctl first
    if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
      if systemctl is-enabled clinic-watcher.service >/dev/null 2>&1; then
        sudo systemctl restart clinic-watcher.service >/dev/null 2>&1 || true
        sleep 1
        if systemctl is-active --quiet clinic-watcher.service 2>/dev/null; then
          exit 0
        fi
      fi
    fi
    # Fallback restart in background daemon mode
    echo "[$(date '+%F %T')] [WATCHDOG] Watcher not running. Restarting in background..." >> "$LOG"
    "$0" --daemon
    exit $?
    ;;

  --daemon)
    if running_pid=$(is_running); then
      echo "  [OK] Clinic watcher already running (PID $running_pid)."
      exit 0
    fi
    # Launch in background, detached from current terminal session
    nohup "$0" >> "$LOG" 2>&1 &
    DAEMON_PID=$!
    disown "$DAEMON_PID" 2>/dev/null || true
    echo "  [OK] Clinic watcher started in background (PID $DAEMON_PID)."
    echo "       Log: $LOG"
    exit 0
    ;;
esac

# ------------------------------------------------------------
#  Foreground Daemon Loop
# ------------------------------------------------------------

# Check for existing instance
if running_pid=$(is_running); then
  if [ "$running_pid" != "$$" ]; then
    echo "  [!] Clinic watcher is already running with PID $running_pid. Exiting duplicate."
    exit 0
  fi
fi

# Write PID
echo "$$" > "$PIDFILE"
chmod 666 "$PIDFILE" 2>/dev/null || true

# Ignore SIGHUP so terminal / SSH disconnects DO NOT kill this daemon
trap '' HUP

# Graceful cleanup on INT or TERM
cleanup() {
  echo "[$(date '+%F %T')] Clinic watcher stopping (PID $$)." >> "$LOG"
  rm -f "$PIDFILE" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

rotate_log_if_needed
echo "[$(date '+%F %T')] Clinic watcher daemon started (PID $$)" >> "$LOG"

# Continuous monitoring loop
while true; do
  if [ -f "$FLAG" ]; then
    echo "[$(date '+%F %T')] Update request detected ($FLAG)." >> "$LOG"
    rm -f "$FLAG" 2>/dev/null || true
    
    rotate_log_if_needed

    if [ -f "$ROOT/update.sh" ]; then
      echo "[$(date '+%F %T')] Executing update.sh..." >> "$LOG"
      /bin/bash "$ROOT/update.sh" >> "$LOG" 2>&1
      RC=$?
      echo "[$(date '+%F %T')] update.sh finished (exit code $RC)." >> "$LOG"
    elif [ -f "$ROOT/start.sh" ]; then
      echo "[$(date '+%F %T')] Executing start.sh --quick..." >> "$LOG"
      git stash --include-untracked >> "$STATUS_FILE" 2>&1 || git stash >> "$STATUS_FILE" 2>&1 || true
      /bin/bash "$ROOT/start.sh" --quick --no-color 2>&1 | tee -a "$STATUS_FILE" >> "$LOG"
      RC=${PIPESTATUS[0]}
      echo "[$(date '+%F %T')] start.sh --quick finished (exit code $RC)." >> "$LOG"
    else
      echo "[$(date '+%F %T')] ERROR: Neither update.sh nor start.sh found in $ROOT." >> "$LOG"
      echo "[!] ERROR: Neither update.sh nor start.sh found on host." >> "$STATUS_FILE" 2>/dev/null || true
    fi

    chmod 666 "$STATUS_FILE" 2>/dev/null || true
  fi

  sleep 3
done
