# Clinic App: Docker Workspace

> **Purpose of this file:** hand this to an AI assistant (or a developer) to review, fix, and implement the setup in the real repo. Section 1 is context, Section 2 is the target layout, Section 3 has every file, Section 4 is setup, Section 5 is the checklist of what to verify or fix.

---

## 1. Context

- A Node.js API plus a PostgreSQL database for a **local clinic**.
- Hosted on a **single HP desktop, 8GB RAM**, serving **6-10 client PCs** on the LAN.
- Goals: reliable, easy to update, little downtime, safe data, simple downtime tracking.
- The app already has an **admin "Update the app" button**. It must be reworked to be safe (see Section 3.6). The goal is only "update the program", so it must not get Docker access.

### Hard requirements

1. Two services: `app` (Node.js) and `db` (Postgres).
2. Named volume for Postgres data (`/var/lib/postgresql/data`).
3. `shm_size: 512mb` on the DB.
4. Custom Docker network. **Postgres 5432 must NOT be published to the host.** Node is published on port 3000.
5. Postgres `healthcheck` using `pg_isready`.
6. `app` uses `depends_on` with `condition: service_healthy`.
7. `restart: unless-stopped` on both.
8. Optimized production `Dockerfile`.
9. `.env.example`.
10. `update.sh` that pulls from Git, rebuilds, and runs `docker compose up -d`.

### Deliberate deviations from the original (Gemini) prompt

| Original ask                 | What was done instead                                                         | Why                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| "Internal custom network"    | Normal custom **bridge** network, with no `ports:` on the db                  | `internal: true` blocks host port publishing, so the LAN couldn't reach port 3000. Not publishing 5432 gives the same isolation for the DB. |
| Admin button triggers update | Button only writes a **flag file**; a host-side systemd unit runs `update.sh` | Mounting `/var/run/docker.sock` into the app is root-equivalent on the host.                                                                |
| Simple `update.sh`           | Adds lock, pre-update DB backup, health wait, **automatic rollback**          | A failed update on a clinic machine must not leave it down with no way back.                                                                |

---

## 2. File hierarchy

Everything lives in **one folder, which is the Git repo root** (example path: `/opt/clinic`). App code and Docker files sit together so `git pull` updates everything.

```
/opt/clinic/                  <- the cloned Git repo (project root)
├── docker-compose.yml        <- committed
├── Dockerfile                <- committed
├── update.sh                 <- committed (chmod +x)
├── .env.example              <- committed
├── .dockerignore             <- committed
├── .gitignore                <- committed
├── package.json              <- existing app
├── package-lock.json
├── src/
│   └── index.js              <- existing app entry (must match CMD in Dockerfile)
│
├── .env                      <- NOT committed (real secrets, created by hand)
├── backups/                  <- NOT committed (created by update.sh)
└── run/                      <- NOT committed (update.request flag lands here)
```

Files **outside** the repo (system-level):

| File                    | Location               |
| ----------------------- | ---------------------- |
| `clinic-update.path`    | `/etc/systemd/system/` |
| `clinic-update.service` | `/etc/systemd/system/` |
| nightly backup line     | added via `crontab -e` |

Optionally keep copies of the systemd files in the repo under `deploy/` and copy them to `/etc/systemd/system/` during setup (they won't auto-update).

### Permission gotcha

The app container runs as the `node` user (uid 1000) and must be able to write to `run/`:

```bash
mkdir -p run backups
sudo chown 1000:1000 run
```

---

## 3. Files

### 3.1 `docker-compose.yml`

```yaml
name: clinic

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    shm_size: 512mb
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    # Tuned for an 8GB host shared with the app and OS
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1536MB
      -c work_mem=8MB
      -c maintenance_work_mem=128MB
      -c max_connections=50
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks: [backend] # no "ports:" -> not reachable from the LAN
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    deploy:
      resources:
        limits:
          memory: 2g
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }

  app:
    build: .
    image: clinic-app:latest
    restart: unless-stopped
    init: true # proper signal handling / zombie reaping
    env_file: .env
    environment:
      DB_HOST: db
      DB_PORT: 5432
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    networks: [backend]
    volumes:
      - ./run:/run/updater # update-request flag only, no docker socket
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 20s
    deploy:
      resources:
        limits:
          memory: 1g
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }

networks:
  backend:
    driver: bridge

volumes:
  pgdata:
```

The app **must expose `GET /health`** returning HTTP 200 (ideally after a `SELECT 1` against the DB).

### 3.2 `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

# ---- deps (production + dev for prisma) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --chown=node:node . .

USER node
EXPOSE 3000
CMD ["sh", "-c", "if [ -d prisma/migrations ]; then npx prisma migrate deploy; else npx prisma db push --accept-data-loss; fi && npx prisma db seed 2>/dev/null ; node server.js"]
```

If the app has a build step (TypeScript, bundler), add a `build` stage and copy only the output (e.g. `dist/`) into the runtime stage.

### 3.3 `.env.example`

```env
# --- App ---
APP_PORT=3000
NODE_ENV=production

# --- Database ---
DB_USER=clinic_user
DB_PASSWORD=change-me-to-a-long-random-string
DB_NAME=clinic

# Optional: single connection string if the app prefers it
# DATABASE_URL=postgres://clinic_user:password@db:5432/clinic
```

Copy to `.env`, fill in real values, never commit `.env`. Avoid `@`, `:` and `/` in the password if building a `DATABASE_URL`.

### 3.4 `.dockerignore`

```
node_modules
.git
.env
backups
run
```

### 3.5 `.gitignore`

```
node_modules
.env
backups/
run/
```

### 3.6 `update.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Only one update at a time
exec 9>/tmp/clinic-update.lock
flock -n 9 || { echo "Update already running"; exit 1; }

mkdir -p backups run
set -a; source .env; set +a

PREV=$(git rev-parse HEAD)
echo "[1/5] Backing up database..."
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "backups/pre-update-$(date +%F_%H%M).sql.gz"

echo "[2/5] Pulling latest code..."
git stash
git pull --ff-only

echo "[3/5] Building and restarting..."
if docker compose build app && docker compose up -d --remove-orphans; then
  echo "[4/5] Waiting for app to become healthy..."
  for i in $(seq 1 30); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo starting)
    [ "$status" = "healthy" ] && { echo "[5/5] Update OK: $(git rev-parse --short HEAD)"; docker image prune -f >/dev/null; exit 0; }
    sleep 5
  done
fi

echo "!! Update failed, rolling back to $PREV"
git reset --hard "$PREV"
docker compose build app
docker compose up -d
exit 1
```

Run `chmod +x update.sh`.

### 3.7 Safe admin "Update" button

**Do not** mount the Docker socket into the app. Instead:

1. The admin button handler (admin-only route) writes a flag file:
   ```js
   fs.writeFileSync("/run/updater/update.request", "");
   ```
2. A host-side systemd path unit watches the flag and runs `update.sh`.
3. The UI shows "Updating, back in a minute" and polls `/health` until it responds.

`/etc/systemd/system/clinic-update.path`

```ini
[Path]
PathExists=/opt/clinic/run/update.request
Unit=clinic-update.service

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/clinic-update.service`

```ini
[Service]
Type=oneshot
WorkingDirectory=/opt/clinic
ExecStart=/opt/clinic/update.sh
ExecStartPost=/bin/rm -f /opt/clinic/run/update.request
```

Adjust `/opt/clinic` to the real path. Enable with:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now clinic-update.path
```

### 3.8 Nightly backup (cron)

`crontab -e`:

```
0 2 * * * cd /opt/clinic && docker compose exec -T db pg_dump -U clinic_user clinic | gzip > backups/nightly-$(date +\%a).sql.gz
```

Keeps 7 rotating daily backups. Also copy `backups/` to a USB drive or another machine regularly, since a backup on the same disk doesn't survive disk failure.

### 3.9 Optional: downtime tracking

Docker healthchecks plus `docker compose logs` cover the basics. For uptime history and alerts, add **Uptime Kuma** (https://github.com/louislam/uptime-kuma) as a third container monitoring `http://app:3000/health`. It is lightweight and fine on 8GB.

---

## 4. Initial setup

```bash
git clone <your-repo> /opt/clinic && cd /opt/clinic
cp .env.example .env && nano .env     # set real passwords
mkdir -p run backups
sudo chown 1000:1000 run
chmod +x update.sh
docker compose up -d --build
docker compose ps                      # both services should show "healthy"
sudo systemctl enable docker           # start on boot

# Seed the database with initial admin accounts
curl http://localhost:3000/api/seed-db
```

Then install the systemd units (3.7) and the cron job (3.8).

---

## 5. Review / fix checklist

Please go through the actual repo and make sure the following hold. Fix anything that doesn't, and report what changed.

- [ ] Entry file in the Dockerfile `CMD` matches the real app entry (`src/index.js` is a placeholder).
- [ ] App implements `GET /health` (200 when the DB is reachable). The compose healthcheck depends on it.
- [ ] App reads DB settings from env (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, or `DATABASE_URL`) and uses `db` as the host, not `localhost`.
- [ ] Node 22 is compatible with the app's dependencies (the healthcheck uses built-in `fetch`, so Node 18+ is required).
- [ ] If the app has a build step, the Dockerfile has a build stage and copies only the output.
- [ ] Database **migrations** run safely on startup or as part of the update (and don't run twice concurrently).
- [ ] Existing admin update button is changed to write the flag file only, restricted to admin users, with no `docker.sock` and no shell/exec of Docker commands from the app.
- [ ] UI shows an "updating" state and polls `/health`.
- [ ] `run/` is writable by uid 1000 and the flag path matches in the app, compose volume, and systemd units.
- [ ] `.env`, `backups/`, `run/` are in `.gitignore`; `.dockerignore` is present.
- [ ] `update.sh` is executable and works when run by systemd (it runs as root there, so check Git ownership issues such as `safe.directory`, and that Git credentials/SSH keys are available for `git pull`).
- [ ] The rollback path in `update.sh` is acceptable (it uses `git reset --hard`; confirm no local uncommitted changes on the server matter).
- [ ] Postgres `shared_buffers` and the 2g memory limit make sense for the 8GB host along with the 1g app limit.
- [ ] Port 5432 is not reachable from another PC on the LAN (test with `nc -zv <server-ip> 5432` from a client).
- [ ] Host firewall allows port 3000 from the clinic LAN only.
- [ ] Restore from a backup has been tested at least once:
  ```bash
  gunzip -c backups/<file>.sql.gz | docker compose exec -T db psql -U "$DB_USER" "$DB_NAME"
  ```
- [ ] Server auto-starts after power loss (BIOS "restore on AC power" setting, `systemctl enable docker`).
