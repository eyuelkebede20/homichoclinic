#!/usr/bin/env bash
# ============================================================
#  deploy/install-watcher.sh
#  Linux equivalent of deploy\install-watcher.bat
#
#  Installs the clinic-update systemd units so the admin
#  "Pull Latest Updates" button automatically triggers update.sh.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
cd "$ROOT"

SILENT="${1:-}"

echo "  [..] Setting up clinic update watcher on Linux..."

# Ensure directories and permissions exist
mkdir -p "$ROOT/run" "$ROOT/backups" "$ROOT/logs"
chmod 777 "$ROOT/run" 2>/dev/null || true
chmod +x "$ROOT/update.sh" "$ROOT/deploy/"*.sh 2>/dev/null || true

if ! command -v systemctl >/dev/null 2>&1; then
  echo "  [!] systemd is not available on this system."
  echo "      Starting deploy/clinic-watcher.sh in background instead..."
  nohup "$ROOT/deploy/clinic-watcher.sh" >/dev/null 2>&1 &
  echo "  [OK] clinic-watcher.sh started in background (PID $!)."
  exit 0
fi

RUN_USER="${SUDO_USER:-$(id -un)}"
tmp=$(mktemp -d)

cat > "$tmp/clinic-update.path" <<UNIT
[Unit]
Description=Watch for clinic update requests

[Path]
PathExists=$ROOT/run/update.request
Unit=clinic-update.service

[Install]
WantedBy=multi-user.target
UNIT

cat > "$tmp/clinic-update.service" <<UNIT
[Unit]
Description=Run the clinic update

[Service]
Type=oneshot
User=$RUN_USER
WorkingDirectory=$ROOT
# Add docker group supplementary access if it exists
SupplementaryGroups=docker
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Remove the flag first so failed update does not loop
ExecStartPre=+/bin/rm -f $ROOT/run/update.request
ExecStart=$ROOT/update.sh
UNIT

sudo install -m 644 "$tmp/clinic-update.path" "$tmp/clinic-update.service" /etc/systemd/system/
rm -rf "$tmp"

sudo systemctl daemon-reload
sudo systemctl enable --now clinic-update.path >/dev/null 2>&1

echo "  [OK] clinic-update.path systemd watcher installed and active."
if [ "$SILENT" != "silent" ]; then
  echo "       Check status: sudo systemctl status clinic-update.path"
fi
exit 0
