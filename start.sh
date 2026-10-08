#!/usr/bin/env bash
# ============================================================
#  start.sh  -  Start / update the Bure Clinic system on Linux
#  Place: repo root (same folder as docker-compose.yml)
#  Run:   ./start.sh        (first time: chmod +x start.sh)
#
#  Uses Docker Engine (docker-ce) and the compose plugin.
#  It does NOT need Docker Desktop.
#
#  FULL START (default), in order:
#    0. Pulls the latest code from GitHub (never blocks startup
#       if the clinic is offline) and restarts itself
#    1. Checks Docker Engine, the compose plugin and the daemon
#    2. Creates run, backups and logs folders, checks project files
#    3. Makes sure .env exists and has real passwords
#    4. Installs the update watcher once (systemd path unit)
#    5. Starts the database and the app (live build output)
#    6. Waits until the app reports healthy
#    7. Shows the address to open from the clinic PCs
#
#  QUICK UPDATE:  ./start.sh --quick
#    Fast app-only update after a code change (about 10-30 s):
#    pulls the code, backs up the database, builds the new app
#    image WHILE THE OLD ONE KEEPS RUNNING, swaps it, waits until
#    healthy, and ROLLS BACK automatically if it is not. The
#    database is never restarted. If the build fails, the running
#    system is not touched at all.
#
#  Options:
#    --quick        fast app-only update with automatic rollback
#    --no-backup    with --quick: skip the database backup
#    --rebuild      clean rebuild of the image (no cache)
#    --update       require the git pull to succeed
#    --no-update    skip the git pull
#    --quiet        spinner instead of live build output
#    --no-color     plain output
#    --pause        wait for a key at the end (desktop launchers)
#    --help         show this text
#
#  Settings (environment variables):
#    REQUIRE_UPDATE=1   stop if the git pull fails (default 0)
#    QUICK_TIMEOUT=90   seconds to wait for health in --quick
#
#  To STOP the system:   docker compose down
#  WARNING: never add -v to that command. It deletes the
#  database volume, which means ALL patient data is lost.
#
#  Every start, success and failure is logged with a time stamp
#  to logs/startup-history.log (useful for tracking downtime).
#  Docker build output is saved to logs/compose.log.
# ============================================================

set -uo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
SELF="$ROOT/$(basename "${BASH_SOURCE[0]}")"
cd "$ROOT" || exit 1
mkdir -p logs

USE_COLOR=1; NO_UPDATE=0; PAUSE=0; CHILD=0; NEEDS_BUILD=0
QUICK=0; NO_BACKUP=0; REBUILD=0; QUIET=0
REQUIRE_UPDATE="${REQUIRE_UPDATE:-0}"
QUICK_TIMEOUT="${QUICK_TIMEOUT:-90}"
for a in "$@"; do
  case "$a" in
    --child)      CHILD=1 ;;
    --updated)    NEEDS_BUILD=1 ;;      # internal: set after a pull brought new code
    --quick)      QUICK=1 ;;
    --no-backup)  NO_BACKUP=1 ;;
    --rebuild)    REBUILD=1 ;;
    --update)     REQUIRE_UPDATE=1 ;;
    --no-update)  NO_UPDATE=1 ;;
    --quiet)      QUIET=1 ;;
    -v|--verbose) : ;;                  # live output is already the default
    --no-color)   USE_COLOR=0 ;;
    --pause)      PAUSE=1 ;;
    -h|--help)    awk 'NR>1 && /^#/ {sub(/^# ?/,""); print; next} NR>1 {exit}' "$SELF"; exit 0 ;;
    *)            echo "Unknown option: $a   (try --help)"; exit 2 ;;
  esac
done

if [ "$USE_COLOR" = 1 ] && [ -t 1 ]; then
  G=$'\e[92m'; R=$'\e[91m'; Y=$'\e[93m'; C=$'\e[96m'; Z=$'\e[0m'
else
  G=''; R=''; Y=''; C=''; Z=''
fi

log() { printf '%s - %s\n' "$(date '+%F %T')" "$*" >> "$ROOT/logs/startup-history.log"; }

# ------------------------------------------------------------
#  0. Self-update from GitHub, then restart this script.
#     The group below is parsed completely before it runs, so
#     replacing this file during git pull is safe. Offline or
#     a failed pull does NOT stop the clinic from starting.
# ------------------------------------------------------------
if [ "$CHILD" -eq 0 ] && [ "$NO_UPDATE" -eq 0 ] && [ -d .git ] && command -v git >/dev/null 2>&1; then
  {
    echo
    echo "  ${Y}[..]${Z} Checking for system updates from GitHub..."
    OLD_HEAD=$(git rev-parse HEAD 2>/dev/null || echo none)
    if GIT_TERMINAL_PROMPT=0 timeout 30 git pull --ff-only; then
      log "git pull OK"
      NEW_HEAD=$(git rev-parse HEAD 2>/dev/null || echo none)
      if [ "$OLD_HEAD" != "$NEW_HEAD" ]; then UPDATED_ARG="--updated"; else UPDATED_ARG=""; fi
    else
      log "git pull failed"
      if [ "$REQUIRE_UPDATE" = 1 ]; then
        echo "  ${R}[!] Could not pull the latest changes. Stopping.${Z}"
        exit 1
      fi
      echo "  ${Y}[!] Could not reach GitHub or the pull failed.${Z}"
      if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
        echo "      This PC has local edits to tracked files, which can block a pull."
      fi
      echo "      Continuing with the version already on this PC."
      UPDATED_ARG=""
    fi
    exec bash "$SELF" --child $UPDATED_ARG "$@"
  }
fi

log "START requested ($([ "$QUICK" = 1 ] && echo quick || echo full))"

# ------------------------------------------------------------
#  Helpers
# ------------------------------------------------------------
IS_TTY=0; [ -t 1 ] && IS_TTY=1
if [ "$IS_TTY" = 1 ]; then printf '\e[?25l'; fi
trap '[ "$IS_TTY" = 1 ] && printf "\e[?25h"' EXIT
trap 'echo; echo "  Interrupted."; log "interrupted"; exit 130' INT TERM

SPIN='|/-\'
PAT='..........##..........'
FULLS='#######'; EMPTYS='.......'
F=0; T0=$SECONDS

mark()      { T0=$SECONDS; }
fmt_el()    { local e=$(( SECONDS - T0 )); printf '%d:%02d' $((e/60)) $((e%60)); }
clearline() { [ "$IS_TTY" = 1 ] && printf '\r\e[K'; return 0; }
frame() {   # frame "message"  -> draws ONE animation frame on the same line
  [ "$IS_TTY" = 1 ] || return 0
  F=$(( (F + 1) % 20 ))
  local pos=$F; [ "$pos" -gt 10 ] && pos=$(( 20 - pos ))
  printf '\r   %s%s%s %s  [%s] %s    \e[K' "$C" "${SPIN:$((F % 4)):1}" "$Z" "$1" "${PAT:$pos:12}" "$(fmt_el)"
}
step() {    # step N "text"  -> overall progress bar (full start)
  local n=$1
  echo; echo "  ${C}[${FULLS:0:n}${EMPTYS:n}]${Z} Step $n of 7 - $2"
  log "step $n: $2"
}
qstep() {   # qstep N "text"  -> progress for --quick (4 stages)
  local n=$1
  echo; echo "  ${C}[${FULLS:0:n}${EMPTYS:0:$((4-n))}]${Z} Quick update $n of 4 - $2"
  log "quick $n: $2"
}
ok()   { echo "  ${G}[OK]${Z} $*"; }
warn() { echo "  ${Y}[!]${Z} $*"; }
info() { echo "  ${Y}[..]${Z} $*"; }
pause_if() { if [ "$PAUSE" = 1 ] && [ -t 0 ]; then read -rsn1 -p "  Press any key to close..." _; echo; fi; return 0; }
die() {     # die "headline" "detail" ...
  local head=$1; shift
  clearline; echo
  echo "  ${R}[!] ${head}${Z}"
  for l in "$@"; do echo "      $l"; done
  log "FAILED: $head"
  echo; pause_if; exit 1
}
spin_pid() { # spin_pid PID "message" -> animates while PID runs, returns its exit code
  local pid=$1 msg=$2; mark
  while kill -0 "$pid" 2>/dev/null; do frame "$msg"; sleep 0.25; done
  clearline; wait "$pid"
}

DOCKER=(docker)
PROG=()
dc() { "${DOCKER[@]}" compose "$@"; }
docker_up() { "${DOCKER[@]}" info >/dev/null 2>&1; }
svc_status() {  # svc_status db|app -> starting | healthy | unhealthy | running
  local cid
  cid=$(dc ps -q "$1" 2>/dev/null | head -n1)
  [ -z "$cid" ] && { echo starting; return; }
  "${DOCKER[@]}" inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo starting
}
wait_healthy() { # wait_healthy SECONDS -> 0 healthy, 1 timed out. Sets DBS and APS.
  local limit=$1 n=0; DBS=starting; APS=starting; mark
  while :; do
    if [ $(( n % 20 )) -eq 0 ]; then DBS=$(svc_status db); APS=$(svc_status app); fi
    if [ "$APS" = healthy ]; then clearline; return 0; fi
    if [ $(( SECONDS - T0 )) -ge "$limit" ]; then clearline; return 1; fi
    frame "Database: $DBS  App: $APS"
    sleep 0.25; n=$(( n + 1 ))
  done
}
run_logged() { # run_logged "spinner message" command...  -> live output (default) or spinner (--quiet)
  local msg=$1; shift
  : > logs/compose.log
  if [ "$QUIET" = 1 ]; then
    "$@" > logs/compose.log 2>&1 &
    spin_pid $! "$msg"; return $?
  fi
  echo "  ------------------------------------------------------------"
  mark
  "$@" 2>&1 | tee logs/compose.log
  local rc=${PIPESTATUS[0]}
  echo "  ------------------------------------------------------------"
  return "$rc"
}
show_failure() { # show_failure EXITCODE
  echo "  ${R}[!] docker compose failed (exit code $1).${Z}"
  echo
  echo "      Lines that mention an error:"
  grep -iE 'error|failed|cannot|not found|denied|no such|unable' logs/compose.log | tail -n 10 | sed 's/^/        /'
  if [ "$QUIET" = 1 ]; then
    echo; echo "      Last 40 lines of the output:"; echo
    tail -n 40 logs/compose.log | sed 's/^/        /'
  fi
  echo
  echo "      Full output:  logs/compose.log"
  echo "      Clean build:  ./start.sh --rebuild"
}
lan_ip() {
  local addr
  addr=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')
  [ -z "$addr" ] && addr=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo "${addr:-localhost}"
}

# ------------------------------------------------------------
#  --quick : app-only update with automatic rollback
# ------------------------------------------------------------
quick_update() {
  [ -f .env ] || die ".env was not found." "Run ./start.sh once for the first full start."
  local cid old_id app_ref repo bfile rc

  qstep 2 "Saving the current version and the database"
  cid=$(dc ps -q app 2>/dev/null | head -n1)
  [ -n "$cid" ] || die "The clinic system is not running." "Use ./start.sh for a full start first."
  old_id=$("${DOCKER[@]}" inspect -f '{{.Image}}' "$cid")
  app_ref=$("${DOCKER[@]}" inspect -f '{{.Config.Image}}' "$cid")
  repo=${app_ref%%:*}
  "${DOCKER[@]}" tag "$old_id" "${repo}:previous" 2>/dev/null || true
  ok "Current version kept as ${repo}:previous"

  bfile=""
  if [ "$NO_BACKUP" = 1 ]; then
    warn "Database backup skipped (--no-backup)."
  else
    mkdir -p backups
    bfile="backups/pre-quick-$(date +%F_%H%M%S).sql.gz"
    dc exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' 2>logs/backup.err | gzip > "$bfile"
    rc=${PIPESTATUS[0]}
    if [ "$rc" -eq 0 ] && [ "$(stat -c %s "$bfile")" -gt 100 ]; then
      ok "Database backed up to $bfile"
      # keep only the 10 newest quick backups
      ls -1t backups/pre-quick-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    else
      rm -f "$bfile"
      die "The database backup failed, so the update was cancelled." \
        "Nothing was changed. See logs/backup.err" \
        "To update anyway:  ./start.sh --quick --no-backup"
    fi
  fi

  qstep 3 "Building the new version (the clinic keeps running meanwhile)"
  git rev-parse --short HEAD > version.txt 2>/dev/null || true
  local bargs=(build); [ "$REBUILD" = 1 ] && bargs+=(--no-cache)
  run_logged "Building the new app image" dc ${PROG[@]+"${PROG[@]}"} "${bargs[@]}" app; rc=$?
  if [ "$rc" -ne 0 ]; then
    show_failure "$rc"
    echo
    echo "      ${G}The running system was NOT touched. Users are unaffected.${Z}"
    log "FAILED: quick build (exit $rc)"
    echo; pause_if; exit 1
  fi
  ok "New version built in $(fmt_el)."

  qstep 4 "Switching to the new version"
  mark
  if dc up -d --no-deps --no-build app && wait_healthy "$QUICK_TIMEOUT"; then
    "${DOCKER[@]}" image prune -f >/dev/null 2>&1 || true
    ok "New version is healthy. Total switch time: $(fmt_el)."
    log "OK: quick update healthy"
    echo
    echo " ${G}=====================================================${Z}"
    echo " ${G}   UPDATE COMPLETE${Z}"
    echo " ${G}=====================================================${Z}"
    echo "  Tip: press Ctrl+F5 in the browser so it loads the new files."
    echo; pause_if; exit 0
  fi

  # ---- the new version failed: roll back ----
  clearline
  echo "  ${R}[!] The new version did not become healthy.${Z}"
  echo "      Last lines of the app log (saved to logs/quick-failed-app.log):"; echo
  dc logs --tail 40 app 2>&1 | tee logs/quick-failed-app.log | sed 's/^/        /'
  echo
  warn "Rolling back to the previous version..."
  "${DOCKER[@]}" tag "$old_id" "$app_ref"
  if dc up -d --no-deps --no-build --force-recreate app && wait_healthy 90; then
    ok "Rolled back. The previous version is running again."
    log "ROLLED BACK: new version unhealthy"
  else
    echo "  ${R}[!] The rollback ALSO failed. Check: docker compose logs app${Z}"
    log "FAILED: rollback unhealthy"
  fi
  [ -n "$bfile" ] && echo "      If the new version changed the database, restore from: $bfile"
  echo; pause_if; exit 1
}

echo
echo " ${C}=====================================================${Z}"
echo " ${C}  Bure Clinic Management System  -  $([ "$QUICK" = 1 ] && echo 'Quick Update' || echo Startup)${Z}"
echo " ${C}=====================================================${Z}"

# ------------------------------------------------------------
#  1. Docker Engine check
# ------------------------------------------------------------
if [ "$QUICK" = 1 ]; then qstep 1 "Checking Docker"; else step 1 "Checking Docker"; fi

command -v docker >/dev/null 2>&1 || die "Docker Engine is not installed on this computer." \
  "Install it from https://docs.docker.com/engine/install/ and run this again."
docker compose version >/dev/null 2>&1 || die "The Docker Compose plugin is missing." \
  "Install it:  sudo apt-get install docker-compose-plugin"

if ! docker_up; then
  out=$(docker info 2>&1 || true)
  if grep -qi 'permission denied' <<<"$out"; then
    if command -v sudo >/dev/null 2>&1; then
      DOCKER=(sudo docker)
      warn "Your user is not in the docker group, so sudo is used."
      echo "      Fix permanently:  sudo usermod -aG docker \$USER   then log out and in."
    else
      die "No permission to use Docker." "Run as root or add your user to the docker group."
    fi
  fi
fi

if ! docker_up; then
  command -v systemctl >/dev/null 2>&1 || die "Docker is not running and systemctl is not available." \
    "Start the Docker daemon manually, then run this again."
  info "Docker is not running - starting it now."
  # ask for the sudo password HERE, in the foreground. A background sudo
  # cannot prompt and would hang silently.
  sudo -v || die "sudo is needed to start the Docker service." "Run:  sudo systemctl start docker"
  echo
  sudo systemctl start docker >/dev/null 2>&1 &
  spin_pid $! "Starting the Docker service" || true
  mark
  while ! docker_up; do
    [ $(( SECONDS - T0 )) -ge 120 ] && die "Docker could not be started." \
      "Check:  sudo systemctl status docker   and   sudo journalctl -u docker -n 50"
    frame "Waiting for Docker"; sleep 0.25
  done
  clearline
fi
ok "Docker Engine is running."

if command -v systemctl >/dev/null 2>&1 && ! systemctl is-enabled --quiet docker 2>/dev/null; then
  warn "Docker is not set to start at boot. After a power cut the clinic would stay down."
  echo "      Fix:  sudo systemctl enable docker"
fi

# plain progress = every build step and error printed in full
dc --progress=plain version >/dev/null 2>&1 && PROG=(--progress=plain)

if [ "$QUICK" = 1 ]; then quick_update; fi

# ------------------------------------------------------------
#  2. Folders and project files
#     run     = where the Update button drops its request file
#     backups = database backups made before every update
# ------------------------------------------------------------
step 2 "Preparing folders"
mkdir -p run backups logs
# the app container runs as uid 1000 and must be able to write to run/
if [ "$(stat -c %u run)" != "1000" ]; then
  chown 1000:1000 run 2>/dev/null || sudo chown 1000:1000 run 2>/dev/null \
    || warn "Could not give run/ to uid 1000. The Update button may fail."
fi
ok "Folders ready: run, backups, logs."

if ! { [ -f docker-compose.yml ] || [ -f docker-compose.yaml ] || [ -f compose.yaml ] || [ -f compose.yml ]; }; then
  die "docker-compose.yml was not found in $ROOT" \
    "start.sh must sit in the same folder as docker-compose.yml."
fi
if [ ! -f Dockerfile ]; then
  hint="start.sh must sit in the same folder as the Dockerfile."
  ls dockerfile* Dockerfile.* >/dev/null 2>&1 && hint="Found a file with a similar name. Linux is case-sensitive: it must be exactly Dockerfile."
  die "Dockerfile was not found in $ROOT" "$hint"
fi
ok "Project files found."

# ------------------------------------------------------------
#  3. .env check
#     .env holds the database password. It is never committed
#     to Git, so a fresh copy of the project will not have it.
# ------------------------------------------------------------
step 3 "Checking .env settings"

if [ ! -f .env ]; then
  [ -f .env.example ] || die "Neither .env nor .env.example was found." \
    "Restore .env.example from the repository, then run again."
  cp .env.example .env
  echo
  warn ".env was missing - created from .env.example."
  echo "      Set a real DB_PASSWORD now. Use a long random value."
  echo "      Save the file and close the editor to continue."
  echo
  ED="${EDITOR:-}"
  [ -z "$ED" ] && for e in nano vim vi; do command -v "$e" >/dev/null 2>&1 && { ED=$e; break; }; done
  if [ -t 0 ] && [ -n "$ED" ]; then "$ED" .env; else
    die ".env was created from .env.example but needs real values." "Edit .env, then run this again."
  fi
fi
chmod 600 .env 2>/dev/null || true

if grep -qi 'change-me' .env; then
  die '.env still contains the placeholder password "change-me".' \
    "Open .env, replace it with a real password, save, and run this again."
fi
missing=0
for v in DB_USER DB_PASSWORD DB_NAME; do
  if ! grep -Eq "^${v}=.+" .env; then warn ".env is missing the setting $v"; missing=1; fi
done
[ "$missing" = 1 ] && die ".env is missing required settings." \
  "Each setting must be a line like  DB_USER=clinic_user  with no spaces around =." \
  "Compare your .env with .env.example and add the missing lines."
ok ".env present and configured."

# ------------------------------------------------------------
#  4. Update watcher (systemd path unit)
#     Watches run/update.request, which the admin Update button
#     creates, and then runs update.sh. Installed once.
# ------------------------------------------------------------
step 4 "Checking update watcher"

if ! command -v systemctl >/dev/null 2>&1; then
  warn "systemd not found - the admin Update button will not work."
elif systemctl is-enabled --quiet clinic-update.path 2>/dev/null; then
  ok "Update watcher already installed."
elif [ ! -f update.sh ]; then
  warn "update.sh was not found - the admin Update button will not work."
else
  chmod +x update.sh
  info "Installing the update watcher (needs sudo once)..."
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
# remove the flag FIRST (as root) so a failed update cannot retrigger forever
ExecStartPre=+/bin/rm -f $ROOT/run/update.request
ExecStart=$ROOT/update.sh
UNIT
  if sudo install -m 644 "$tmp/clinic-update.path" "$tmp/clinic-update.service" /etc/systemd/system/ \
     && sudo systemctl daemon-reload \
     && sudo systemctl enable --now clinic-update.path >/dev/null 2>&1; then
    ok "Update watcher installed."
  else
    warn "Could not install the update watcher."
    echo "      The clinic will still start; only the Update button is affected."
  fi
  rm -rf "$tmp"
fi

# ------------------------------------------------------------
#  5. Start the stack
#     Live build output by default (also saved to
#     logs/compose.log). Use --quiet for a spinner instead.
#     --build is cheap when nothing changed and makes sure a
#     freshly pulled version is really what runs.
# ------------------------------------------------------------
step 5 "Starting the clinic system"
if [ "$NEEDS_BUILD" = 1 ]; then
  info "New code was downloaded - the app image will be rebuilt."
else
  echo "        First run takes 2-4 minutes. Later starts about 30 seconds."
fi
echo

LAN_IP=$(lan_ip)
info "Network address of this PC: $LAN_IP"

compose_job() {
  git rev-parse --short HEAD > version.txt 2>/dev/null || true
  if [ "$REBUILD" = 1 ]; then
    echo ">>> docker compose build --no-cache"
    dc ${PROG[@]+"${PROG[@]}"} build --no-cache || return $?
  fi
  echo ">>> docker compose up -d --build"
  dc ${PROG[@]+"${PROG[@]}"} up -d --build
}

run_logged "Building and starting containers" compose_job; rc=$?
if [ "$rc" -eq 0 ]; then
  ok "Containers started in $(fmt_el)."
else
  show_failure "$rc"
  echo "      Common causes: no package-lock.json for npm ci, a build error in the"
  echo "      app, port 3000 already in use, a typo in .env, or no internet."
  echo
  echo "      Container state:"; dc ps 2>/dev/null | sed 's/^/        /'
  log "FAILED: docker compose up (exit $rc)"
  echo; pause_if; exit 1
fi

# ------------------------------------------------------------
#  6. Wait for healthy (up to 150 seconds)
#     Shows the live status of the database and of the app.
# ------------------------------------------------------------
step 6 "Waiting for the app to become healthy"
echo

if wait_healthy 150; then
  ok "Database and app are healthy after $(fmt_el)."
  log "OK: app healthy"
else
  echo "  ${R}[!] The app did not become healthy within 2.5 minutes.${Z}"
  echo "      Last lines of the app log:"; echo
  dc logs --tail 30 app
  echo
  echo "      Full log:  docker compose logs app"
  echo "      Database:  docker compose logs db"
  log "FAILED: app not healthy"
  echo; pause_if; exit 1
fi

# ------------------------------------------------------------
#  7. Show the address for the clinic PCs
# ------------------------------------------------------------
step 7 "Access addresses"

if [ -x deploy/show-url.sh ]; then
  ./deploy/show-url.sh
else
  APP_PORT=$(grep -E '^APP_PORT=' .env | tail -n1 | cut -d= -f2- | tr -d '\r" ')
  APP_PORT=${APP_PORT:-3000}
  echo
  echo "  From any clinic PC on the same network, open:"
  echo "        ${C}http://${LAN_IP}:${APP_PORT}${Z}"
  echo
  echo "  On this PC you can also use:  ${C}http://localhost:${APP_PORT}${Z}"
fi

echo
echo " ${G}=====================================================${Z}"
echo " ${G}   THE CLINIC SYSTEM IS READY${Z}"
echo " ${G}=====================================================${Z}"
echo
echo "  Tip: give this PC a fixed IP address in your router so the"
echo "       address above never changes."
echo
pause_if
exit 0