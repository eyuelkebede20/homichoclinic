#!/usr/bin/env bash
# ============================================================
#  start.sh  -  Start the Bure Clinic system on Linux
#  Place: repo root (same folder as docker-compose.yml)
#  Run:   ./start.sh        (first time: chmod +x start.sh)
#
#  Uses Docker Engine (docker-ce) and the compose plugin.
#  It does NOT need Docker Desktop.
#
#  What it does, in order:
#    0. Pulls the latest code from GitHub (never blocks startup
#       if the clinic is offline) and restarts itself
#    1. Checks Docker Engine, the compose plugin and the daemon
#       (starts the daemon with systemd if it is stopped)
#    2. Creates run, backups and logs folders, checks project files
#    3. Makes sure .env exists and has real passwords
#    4. Installs the update watcher once (systemd path unit)
#       so the admin Update button works
#    5. Starts the database and the app with docker compose
#    6. Waits until the app reports healthy
#    7. Shows the address to open from the clinic PCs
#
#  While it works you see a spinner, a moving bar and a timer.
#
#  Options:
#    --no-update   skip the git pull
#    --no-color    plain output
#    --pause       wait for a key at the end (desktop launchers)
#    --help        show this text
#
#  Settings (environment variables):
#    REQUIRE_UPDATE=1   stop if the git pull fails (default 0)
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
REQUIRE_UPDATE="${REQUIRE_UPDATE:-0}"
for a in "$@"; do
  case "$a" in
    --child)     CHILD=1 ;;
    --updated)   NEEDS_BUILD=1 ;;
    --no-update) NO_UPDATE=1 ;;
    --no-color)  USE_COLOR=0 ;;
    --pause)     PAUSE=1 ;;
    -h|--help)   sed -n '2,38p' "$SELF" | sed 's/^# \{0,1\}//'; exit 0 ;;
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
    git rev-parse HEAD > .git-old 2>/dev/null || true
    if timeout 30 git pull --ff-only; then
      log "git pull OK"
      git rev-parse HEAD > .git-new 2>/dev/null || true
      if ! cmp -s .git-old .git-new; then
        UPDATED_ARG="--updated"
      else
        UPDATED_ARG=""
      fi
    else
      log "git pull failed"
      if [ "$REQUIRE_UPDATE" = 1 ]; then
        echo "  ${R}[!] Could not pull the latest changes. Stopping.${Z}"
        exit 1
      fi
      echo "  ${Y}[!] Could not reach GitHub or the pull failed.${Z}"
      echo "      Continuing with the version already on this PC."
      UPDATED_ARG=""
    fi
    exec bash "$SELF" --child $UPDATED_ARG "$@"
  }
fi

log "START requested"

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
step() {    # step N "text"  -> overall progress bar
  local n=$1
  echo; echo "  ${C}[${FULLS:0:n}${EMPTYS:n}]${Z} Step $n of 7 - $2"
  log "step $n: $2"
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
dc() { "${DOCKER[@]}" compose "$@"; }
docker_up() { "${DOCKER[@]}" info >/dev/null 2>&1; }
svc_status() {  # svc_status db|app -> starting | healthy | unhealthy | running
  local cid
  cid=$(dc ps -q "$1" 2>/dev/null | head -n1)
  [ -z "$cid" ] && { echo starting; return; }
  "${DOCKER[@]}" inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo starting
}
lan_ip() {
  local addr
  addr=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')
  [ -z "$addr" ] && addr=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo "${addr:-localhost}"
}

echo
echo " ${C}=====================================================${Z}"
echo " ${C}  Bure Clinic Management System  -  Startup${Z}"
echo " ${C}=====================================================${Z}"

# ------------------------------------------------------------
#  1. Docker Engine check
# ------------------------------------------------------------
step 1 "Checking Docker"

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
#     docker compose runs in the background so the screen can
#     keep animating. Output goes to logs/compose.log.
#     --build is cheap when nothing changed and makes sure a
#     freshly pulled version is really what runs.
# ------------------------------------------------------------
step 5 "Starting the clinic system"
echo "        First run takes 2-4 minutes. Later starts about 30 seconds."
echo

LAN_IP=$(lan_ip)
info "Network address of this PC: $LAN_IP"

  dc up -d --build > logs/compose.log 2>&1 &
  msg="Starting containers (building if code changed)"

if spin_pid $! "$msg"; then
  ok "Containers started in $(fmt_el)."
else
  echo "  ${R}[!] docker compose failed. Last lines of its output:${Z}"
  echo; tail -n 25 logs/compose.log; echo
  echo "      Current container state:"; dc ps 2>/dev/null
  echo
  echo "      Common causes: port 3000 already in use, a typo in .env,"
  echo "      or no internet on the first build. Full output: logs/compose.log"
  log "FAILED: docker compose up"
  echo; pause_if; exit 1
fi

# ------------------------------------------------------------
#  6. Wait for healthy (up to 150 seconds)
#     Shows the live status of the database and of the app.
# ------------------------------------------------------------
step 6 "Waiting for the app to become healthy"
echo

DBS=starting; APS=starting; n=0; mark
while :; do
  if [ $(( n % 20 )) -eq 0 ]; then DBS=$(svc_status db); APS=$(svc_status app); fi
  [ "$APS" = healthy ] && break
  if [ $(( SECONDS - T0 )) -ge 150 ]; then
    clearline
    echo "  ${R}[!] The app did not become healthy within 2.5 minutes.${Z}"
    echo "      Last lines of the app log:"; echo
    dc logs --tail 30 app
    echo
    echo "      Full log:  docker compose logs app"
    echo "      Database:  docker compose logs db"
    log "FAILED: app not healthy"
    echo; pause_if; exit 1
  fi
  frame "Database: $DBS  App: $APS"
  sleep 0.25; n=$(( n + 1 ))
done
clearline
ok "Database and app are healthy after $(fmt_el)."
log "OK: app healthy"

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