#!/usr/bin/env bash
# ============================================================
#  update.sh  -  Linux equivalent of deploy\update.bat
#
#  Called by the systemd watcher (clinic-update.path)
#  when the admin clicks "Pull Latest Updates" in the web UI.
#
#  Also safe to run manually on the terminal.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
cd "$ROOT"

STATUS_FILE="run/update.status"
mkdir -p run backups
echo "" > "$STATUS_FILE"

status() {
    local msg="[$(date +%T)] $1"
    echo "$msg"
    echo "$msg" >> "$STATUS_FILE"
}

status "=== Update started ==="

# Load .env
DB_USER=$(grep -E '^DB_USER=' .env | tail -n1 | cut -d= -f2- | tr -d '\r" ' || true)
DB_NAME=$(grep -E '^DB_NAME=' .env | tail -n1 | cut -d= -f2- | tr -d '\r" ' || true)

LOCK_FILE="/tmp/clinic-update.lock"
if [ -f "$LOCK_FILE" ]; then
    status "!! Another update is already running. Aborting."
    exit 1
fi
echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

PREV=$(git rev-parse HEAD 2>/dev/null || echo "")
status "   Previous commit: $PREV"

# 1. DB backup
status "[1/5] Backing up database..."
BACKUP_FILE="backups/pre-update-$(date +%Y-%m-%d_%H%M).sql.gz"
if docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    status "   [OK] Backup saved: $BACKUP_FILE"
else
    status "   [!] Backup failed - aborting for safety."
    exit 1
fi

# 2. Git pull
status "[2/5] Pulling latest code..."
git stash >> "$STATUS_FILE" 2>&1
if ! git pull --ff-only >> "$STATUS_FILE" 2>&1; then
    status "   [!] git pull failed - no changes applied."
    exit 1
fi
NEW_HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo "")
status "   [OK] Code updated to $NEW_HEAD"

# 3. Build
status "[3/5] Building new image... (takes 2-4 min)"
git rev-parse --short HEAD > version.txt 2>/dev/null || true
if ! docker compose build app >> "$STATUS_FILE" 2>&1; then
    status "   [!] Build failed - rolling back to $PREV"
    git reset --hard "$PREV" >/dev/null 2>&1
    docker compose up -d >> "$STATUS_FILE" 2>&1
    exit 1
fi
status "   [OK] Build complete."

# 4. Restart
status "[4/5] Restarting container..."
docker compose up -d --force-recreate --remove-orphans >> "$STATUS_FILE" 2>&1
status "   [OK] Container restarted - waiting for health check..."

# 5. Health wait
TRIES=0
while [ $TRIES -lt 36 ]; do
    sleep 5
    TRIES=$((TRIES+1))
    CID=$(docker compose ps -q app 2>/dev/null | head -n1 || true)
    if [ -n "$CID" ]; then
        STATE=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CID" 2>/dev/null || echo "unknown")
        if [ "$STATE" = "healthy" ]; then
            status "[5/5] Update complete - $NEW_HEAD is live."
            docker image prune -f >/dev/null 2>&1 || true
            exit 0
        fi
        status "      ... health: $STATE ($TRIES/36)"
    fi
done

# Rollback
status "!! Health check timed out - rolling back to $PREV"
git reset --hard "$PREV" >/dev/null 2>&1
docker compose build app >> "$STATUS_FILE" 2>&1
docker compose up -d >> "$STATUS_FILE" 2>&1
status "!! Rollback complete. Check: docker compose logs app"
exit 1