# deploy/  — Windows Deployment Files

All scripts here are **Windows batch files** (`.bat`) designed for a Windows PC running Docker Desktop.

---

## Quick start (first time only)

Double-click **`START.bat`** in the repo root. It handles everything:

1. Checks Docker Desktop is running
2. Creates `run\` and `backups\` folders
3. Opens `.env` in Notepad if it doesn't exist yet (fill in passwords)
4. Installs the **ClinicUpdater** scheduled task (once)
5. Runs `docker compose up -d --build`
6. Waits for the app to become healthy
7. Prints the clinic URL

After the first run, double-clicking `START.bat` again just brings the stack back up in seconds (no rebuild unless the image is gone).

---

## File reference

| File | What it does | When to run |
|---|---|---|
| `START.bat` *(root)* | One-click full startup | Every time the PC boots |
| `deploy\show-url.bat` | Print the clinic LAN URL + status | Any time |
| `deploy\static-ip.bat` | Lock the server's LAN IP permanently | Once during setup (as Admin) |
| `deploy\update.bat` | Manual update (git pull → build → restart) | If needed manually |
| `deploy\install-watcher.bat` | Install the ClinicUpdater scheduled task | Once (START.bat does this automatically) |
| `deploy\clinic-watcher.bat` | The watcher itself (called by Task Scheduler) | Never directly |

---

## How the "Update the App" button works (Windows)

```
Admin clicks button in browser
        │
        ▼
  /api/update-status action
  writes  run\update.request          ← flag file
        │
        ▼ (within 1 minute)
  Task Scheduler runs clinic-watcher.bat
        │
        ├─ deletes run\update.request
        └─ calls   deploy\update.bat
                        │
                        ├─ [1/5] pg_dump → backups\
                        ├─ [2/5] git pull
                        ├─ [3/5] docker compose build app
                        ├─ [4/5] docker compose up -d
                        └─ [5/5] health check loop (3 min)
                                │
                          writes run\update.status  ← live log
                                │
                        App reads via GET /api/update-status
                                │
                        UI shows live progress in terminal pane
```

On failure, `update.bat` rolls back to the previous `git` commit and restarts the old image.

---

## Static IP (do this once)

Run `deploy\static-ip.bat` **as Administrator**. It auto-detects your LAN adapter, IP, and gateway, then locks them permanently using `netsh`. After this the clinic URL (`http://<ip>:3000`) never changes.

**Simpler alternative:** Set a **DHCP reservation** in your router — assign the server's MAC address a fixed IP. No changes on the PC needed.

---

## Auto-start on Windows boot

1. Press `Win + R` → `shell:startup`
2. Create a shortcut to `START.bat` in the folder that opens

The app will start automatically whenever Windows starts, even after a power cut.

---

## Useful commands

```bat
:: View live app logs
docker compose logs -f app

:: View watcher log (to see what the scheduled task did)
type run\watcher.log

:: View last update progress
type run\update.status

:: Restore from a backup
docker compose exec -T db psql -U clinic_user clinic_db < backups\pre-update-YYYY-MM-DD_HHMM.sql

:: Force-restart without rebuilding
docker compose restart app
```
