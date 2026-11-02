#!/usr/bin/env bash
# ============================================================
#  deploy/install-watcher.sh
#  Self-healing update watcher installer for Bure Clinic
#
#  Installs the clinic-watcher daemon as an auto-restarting
#  system service (systemd) and/or cron watchdog so the
#  admin "Pull Latest Updates" button always works without
#  requiring manual shell intervention.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
cd "$ROOT"

SILENT="${1:-}"

if [ "$SILENT" != "silent" ]; then
  echo "=========================================================="
  echo "  Installing Bure Clinic Update Watcher Daemon"
  echo "=========================================================="
fi

# Ensure directories and permissions exist
mkdir -p "$ROOT/run" "$ROOT/backups" "$ROOT/logs"
chmod 777 "$ROOT/run" 2>/dev/null || true
chmod +x "$ROOT/update.sh" "$ROOT/start.sh" "$ROOT/deploy/"*.sh "$ROOT"/*.sh 2>/dev/null || true

# ------------------------------------------------------------
#  Helper: Install Crontab Watchdog Fallback
# ------------------------------------------------------------
install_cron_watchdog() {
  if ! command -v crontab >/dev/null 2>&1; then
    return 0
  fi

  local current_cron
  current_cron=$(crontab -l 2>/dev/null || true)
  local marker="# Bure Clinic Update Watcher"
  local reboot_cmd="@reboot /bin/bash $ROOT/deploy/clinic-watcher.sh --daemon >/dev/null 2>&1"
  local check_cmd="*/5 * * * * /bin/bash $ROOT/deploy/clinic-watcher.sh --watchdog >/dev/null 2>&1"

  # Filter out existing clinic watcher lines to avoid duplicates
  local filtered_cron
  filtered_cron=$(echo "$current_cron" | grep -v "clinic-watcher.sh" | grep -v "$marker" || true)

  {
    if [ -n "$filtered_cron" ]; then
      echo "$filtered_cron"
    fi
    echo "$marker"
    echo "$reboot_cmd"
    echo "$check_cmd"
  } | crontab - 2>/dev/null || true

  if [ "$SILENT" != "silent" ]; then
    echo "  [OK] Crontab watchdog registered (@reboot and 5-min healthcheck)."
  fi
}

# ------------------------------------------------------------
#  Detection: Systemd vs Background Daemon
# ------------------------------------------------------------
HAS_SYSTEMD=0
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  HAS_SYSTEMD=1
fi

CAN_SUDO=0
if [ "$EUID" -eq 0 ]; then
  CAN_SUDO=1
elif command -v sudo >/dev/null 2>&1; then
  if sudo -n true 2>/dev/null || sudo -v 2>/dev/null; then
    CAN_SUDO=1
  fi
fi

RUN_USER="${SUDO_USER:-$(id -un)}"

# ------------------------------------------------------------
#  Systemd Service Installation (Primary when available)
# ------------------------------------------------------------
SYSTEMD_INSTALLED=0

if [ "$HAS_SYSTEMD" -eq 1 ] && [ "$CAN_SUDO" -eq 1 ]; then
  if [ "$SILENT" != "silent" ]; then
    echo "  [..] Configuring systemd clinic-watcher.service with auto-restart..."
  fi

  # Remove legacy path units to avoid dual triggering or failed state locks
  sudo systemctl stop clinic-update.path clinic-update.service 2>/dev/null || true
  sudo systemctl disable clinic-update.path clinic-update.service 2>/dev/null || true
  sudo rm -f /etc/systemd/system/clinic-update.path /etc/systemd/system/clinic-update.service 2>/dev/null || true

  tmp=$(mktemp -d 2>/dev/null || echo "/tmp/clinic-tmp")
  mkdir -p "$tmp"

  cat > "$tmp/clinic-watcher.service" <<UNIT
[Unit]
Description=Bure Clinic Update Watcher Daemon
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$ROOT
SupplementaryGroups=docker
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:$PATH
ExecStart=/bin/bash $ROOT/deploy/clinic-watcher.sh
Restart=always
RestartSec=5s
KillMode=process
TimeoutStopSec=15
StandardOutput=append:$ROOT/run/watcher.log
StandardError=append:$ROOT/run/watcher.log

[Install]
WantedBy=multi-user.target
UNIT

  if sudo install -m 644 "$tmp/clinic-watcher.service" /etc/systemd/system/clinic-watcher.service 2>/dev/null; then
    sudo systemctl daemon-reload 2>/dev/null || true
    sudo systemctl enable --now clinic-watcher.service >/dev/null 2>&1 || true
    
    # Enable session lingering so user processes don't terminate on logout
    loginctl enable-linger "$RUN_USER" 2>/dev/null || true
    
    sleep 1
    if systemctl is-active --quiet clinic-watcher.service 2>/dev/null; then
      SYSTEMD_INSTALLED=1
      echo "  [OK] clinic-watcher.service is active and managed by systemd."
      echo "       Auto-restart on failure: ENABLED (RestartSec=5s)"
      echo "       Starts automatically on boot: ENABLED"
    fi
  fi
  rm -rf "$tmp" 2>/dev/null || true
fi

# ------------------------------------------------------------
#  Fallback / Safeguard: Daemon Mode & Crontab Watchdog
# ------------------------------------------------------------
if [ "$SYSTEMD_INSTALLED" -eq 0 ]; then
  if [ "$SILENT" != "silent" ]; then
    echo "  [!] Systemd service not applicable (WSL / non-systemd / non-sudo environment)."
    echo "  [..] Activating persistent background daemon and cron watchdog..."
  fi

  # Start the background daemon with SIGHUP immunity and PID tracking
  "$ROOT/deploy/clinic-watcher.sh" --daemon

  # Install cron watchdog for reboot and health checks
  install_cron_watchdog
else
  # Even with systemd, install cron watchdog as a secondary safeguard
  install_cron_watchdog
fi

# ------------------------------------------------------------
#  Status Verification
# ------------------------------------------------------------
if [ "$SILENT" != "silent" ]; then
  echo ""
  echo "  Status:"
  "$ROOT/deploy/clinic-watcher.sh" --status || true
  echo ""
  echo "  Management commands:"
  echo "    Check status:  ./deploy/clinic-watcher.sh --status"
  echo "    Restart:       ./deploy/clinic-watcher.sh --restart"
  echo "    Stop:          ./deploy/clinic-watcher.sh --stop"
  echo "    View logs:     tail -f run/watcher.log"
  echo "=========================================================="
fi

exit 0
