#!/bin/bash
# Bure Clinic - Startup for Ubuntu 20.04

# 1. Self-update and relaunch
if [ "$1" != "child" ]; then
    echo "  [..] Checking for system updates from GitHub..."
    git stash > /dev/null 2>&1
    if ! git pull origin main; then
        echo "  [!] Error: Failed to pull latest changes. Continuing with local version."
    fi
    echo ""
    exec bash "$0" child
fi

echo "====================================================="
echo "  Bure Clinic Management System  -  Startup (Ubuntu)"
echo "====================================================="
echo ""

# Ensure we are in the script's directory
cd "$(dirname "$0")" || exit 1

mkdir -p logs
echo "$(date) - START requested" >> logs/startup-history.log

# 2. Docker check
echo "Step 1 of 5: Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
    echo "  [!] Docker is not installed on this computer."
    echo "      Please install Docker Desktop or Docker Engine for Ubuntu 20.04."
    echo "      Command: sudo apt-get update && sudo apt-get install docker.io docker-compose-v2"
    echo "$(date) - FAILED: docker not installed" >> logs/startup-history.log
    exit 1
fi

# Check if Docker requires sudo
DOCKER_CMD="docker"
if ! docker info >/dev/null 2>&1; then
    if sudo docker info >/dev/null 2>&1; then
        DOCKER_CMD="sudo docker"
    else
        echo "  [..] Docker is not running. Attempting to start it..."
        sudo systemctl start docker
        sleep 3
        if ! sudo docker info >/dev/null 2>&1; then
            echo "  [!] Docker could not be started."
            exit 1
        fi
        DOCKER_CMD="sudo docker"
    fi
fi
echo "  [OK] Docker is running."

# 3. Runtime folders
echo "Step 2 of 5: Preparing folders"
mkdir -p run backups logs
echo "  [OK] Folders ready: run, backups, logs."

# 4. .env check
echo "Step 3 of 5: Checking .env settings"
if [ ! -f ".env" ]; then
    if [ ! -f ".env.example" ]; then
        echo "  [!] Neither .env nor .env.example was found."
        exit 1
    fi
    cp .env.example .env
    echo "  [!] .env was missing - created from .env.example."
    echo "      Please edit the .env file to set a real DB_PASSWORD, then run this again."
    nano .env
    exit 1
fi

if grep -qi "change-me" .env; then
    echo "  [!] .env still contains the placeholder password 'change-me'."
    echo "      Please edit .env, replace it with a secure password, then run again."
    nano .env
    exit 1
fi
echo "  [OK] .env present and configured."

# 5. Start the stack
echo "Step 4 of 5: Starting the clinic system"
echo "  [..] This may take a few minutes if building for the first time..."

# Get true LAN IP on Ubuntu (ignores Docker bridge interfaces by asking the routing table)
LAN_IP=$(ip route get 1 2>/dev/null | awk 'match($0, /src [0-9\.]+/) {print substr($0, RSTART+4, RLENGTH-4)}')
if [ -z "$LAN_IP" ]; then 
    # Fallback if ip route fails
    LAN_IP=$(hostname -I | awk '{print $1}')
fi
if [ -z "$LAN_IP" ]; then LAN_IP="localhost"; fi
export LAN_IP
echo "  [..] Configuring system for network access on IP: $LAN_IP"

# Determine compose command
COMPOSE_CMD="$DOCKER_CMD compose"
if ! $COMPOSE_CMD version >/dev/null 2>&1; then
    COMPOSE_CMD="sudo docker-compose"
fi

$COMPOSE_CMD up -d > logs/compose.log 2>&1
if [ $? -ne 0 ]; then
    echo "  [!] docker compose failed. Last lines of output:"
    tail -n 25 logs/compose.log
    echo ""
    echo "  [!] Common causes: port 3000 already in use, or no internet."
    echo "      Full output available in logs/compose.log"
    exit 1
fi
echo "  [OK] Containers started."

# 6. Wait for healthy
echo "Step 5 of 5: Waiting for the app to become healthy"
N=0
while [ $N -lt 30 ]; do
    APP_ID=$($COMPOSE_CMD ps -q app 2>/dev/null)
    DB_ID=$($COMPOSE_CMD ps -q db 2>/dev/null)
    
    APP_STATUS="starting"
    DB_STATUS="starting"
    
    if [ -n "$APP_ID" ]; then
        APP_STATUS=$($DOCKER_CMD inspect -f '{{.State.Health.Status}}' $APP_ID 2>/dev/null)
    fi
    if [ -n "$DB_ID" ]; then
        DB_STATUS=$($DOCKER_CMD inspect -f '{{.State.Health.Status}}' $DB_ID 2>/dev/null)
    fi
    
    echo -ne "\r  [..] Database: ${DB_STATUS}  |  App: ${APP_STATUS}       "
    
    if [ "$APP_STATUS" = "healthy" ]; then
        echo -ne "\r\033[K"
        echo "  [OK] Database and app are healthy!"
        break
    fi
    sleep 5
    N=$((N+1))
done

if [ "$APP_STATUS" != "healthy" ]; then
    echo ""
    echo "  [!] The app did not become healthy within 2.5 minutes."
    echo "      Last lines of the app log:"
    $COMPOSE_CMD logs --tail 30 app
    exit 1
fi

# 7. Show address
if [ -f "deploy/show-url.sh" ]; then
    bash deploy/show-url.sh
    exit 0
fi

APP_PORT=$(grep '^APP_PORT=' .env | cut -d '=' -f 2 | tr -d '\r')
if [ -z "$APP_PORT" ]; then APP_PORT="3000"; fi

echo ""
echo "====================================================="
echo "   THE CLINIC SYSTEM IS READY"
echo "====================================================="
echo ""
echo "  From any clinic PC on the same network, open:"
echo "        http://$LAN_IP:$APP_PORT"
echo ""
echo "  On this server you can also use:"
echo "        http://localhost:$APP_PORT"
echo ""
echo "  To view live logs: $COMPOSE_CMD logs -f"
echo "  To stop system:    $COMPOSE_CMD down"
echo "====================================================="
echo ""
