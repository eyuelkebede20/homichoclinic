@echo off
setlocal EnableDelayedExpansion
:: ============================================================
::  deploy\update.bat  -  Windows equivalent of update.sh
::
::  Called by the Task Scheduler watcher (clinic-watcher.bat)
::  when the admin clicks "Pull Latest Updates" in the web UI.
::
::  Also safe to double-click manually for a manual update.
::  Run from the repo root (or any location; it self-navigates).
:: ============================================================

set "ROOT=%~dp0.."
cd /d "%ROOT%"

:: ── Status file (read by /api/update-status in the container) ─
set "STATUS_FILE=run\update.status"
if not exist "run" mkdir run
echo. > "%STATUS_FILE%"

:: ── Make gzip available (Git for Windows bundles it) ────────
:: Git ships gzip in its usr\bin folder. Add it to PATH so the
:: pg_dump backup pipe works. If Git is not installed, we fall
:: back to saving an uncompressed .sql file.
set "GIT_USR_BIN="
for %%D in (
    "C:\Program Files\Git\usr\bin"
    "C:\Program Files (x86)\Git\usr\bin"
) do if exist "%%~D\gzip.exe" set "GIT_USR_BIN=%%~D"
if defined GIT_USR_BIN set "PATH=!GIT_USR_BIN!;!PATH!"

call :status "=== Update started ==="

:: ── Load .env ────────────────────────────────────────────────
set "DB_USER="
set "DB_NAME="
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="DB_USER" set "DB_USER=%%B"
    if "%%A"=="DB_NAME" set "DB_NAME=%%B"
)

:: ── Lock: only one update at a time ─────────────────────────
set "LOCK_FILE=%TEMP%\clinic-update.lock"
if exist "%LOCK_FILE%" (
    call :status "!! Another update is already running. Aborting."
    exit /b 1
)
echo %TIME% > "%LOCK_FILE%"

:: ── Save current git HEAD for rollback ──────────────────────
for /f "tokens=*" %%H in ('git rev-parse HEAD 2^>nul') do set "PREV=%%H"
call :status "   Previous commit: !PREV!"

:: ── [1/5] DB backup ─────────────────────────────────────────
call :status "[1/5] Backing up database..."
where gzip >nul 2>&1
if not errorlevel 1 (
    set "BACKUP_FILE=backups\pre-update-%DATE:~-4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%.sql.gz"
    set "BACKUP_FILE=!BACKUP_FILE: =0!"
    docker compose exec -T db pg_dump -U "!DB_USER!" "!DB_NAME!" | gzip > "!BACKUP_FILE!" 2>nul
) else (
    set "BACKUP_FILE=backups\pre-update-%DATE:~-4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%.sql"
    set "BACKUP_FILE=!BACKUP_FILE: =0!"
    docker compose exec -T db pg_dump -U "!DB_USER!" "!DB_NAME!" > "!BACKUP_FILE!" 2>nul
)
if errorlevel 1 (
    call :status "   [!] Backup failed - aborting for safety."
    del "%LOCK_FILE%" >nul 2>&1
    exit /b 1
)
call :status "   [OK] Backup saved: !BACKUP_FILE!"

:: ── [2/5] Git pull ───────────────────────────────────────────
call :status "[2/5] Pulling latest code..."
git stash >> "%STATUS_FILE%" 2>&1
git pull --ff-only >> "%STATUS_FILE%" 2>&1
if errorlevel 1 (
    call :status "   [!] git pull failed - no changes applied."
    del "%LOCK_FILE%" >nul 2>&1
    exit /b 1
)
for /f "tokens=*" %%H in ('git rev-parse --short HEAD 2^>nul') do set "NEW_HEAD=%%H"
call :status "   [OK] Code updated to !NEW_HEAD!"

:: ── [3/5] Build ─────────────────────────────────────────────
call :status "[3/5] Building new image... (takes 2-4 min)"
git rev-parse --short HEAD > version.txt 2>nul
docker compose build app >> "%STATUS_FILE%" 2>&1
if errorlevel 1 (
    call :status "   [!] Build failed - rolling back to !PREV!"
    git reset --hard "!PREV!" >nul 2>&1
    docker compose up -d >> "%STATUS_FILE%" 2>&1
    del "%LOCK_FILE%" >nul 2>&1
    exit /b 1
)
call :status "   [OK] Build complete."

:: ── [4/5] Restart ───────────────────────────────────────────
call :status "[4/5] Restarting container..."
docker compose up -d --force-recreate --remove-orphans >> "%STATUS_FILE%" 2>&1
call :status "   [OK] Container restarted - waiting for health check..."

:: ── [5/5] Health wait ────────────────────────────────────────
set "TRIES=0"
:health_loop
ping 127.0.0.1 -n 6 >nul
set /a TRIES+=1
for /f "delims=" %%C in ('docker compose ps -q app 2^>nul') do (
    for /f "tokens=*" %%S in ('docker inspect -f "{{.State.Health.Status}}" %%C 2^>nul') do (
        if "%%S"=="healthy" (
            call :status "[5/5] Update complete - !NEW_HEAD! is live."
            docker image prune -f >nul 2>&1
            del "%LOCK_FILE%" >nul 2>&1
            exit /b 0
        )
        call :status "      ... health: %%S (!TRIES!/36^)"
    )
)
if !TRIES! lss 36 goto :health_loop

:: ── Rollback ────────────────────────────────────────────────
call :status "!! Health check timed out - rolling back to !PREV!"
git reset --hard "!PREV!" >nul 2>&1
docker compose build app >> "%STATUS_FILE%" 2>&1
docker compose up -d >> "%STATUS_FILE%" 2>&1
call :status "!! Rollback complete. Check: docker compose logs app"
del "%LOCK_FILE%" >nul 2>&1
exit /b 1

:: ── Helper ──────────────────────────────────────────────────
:status
set "MSG=%~1"
echo [%TIME:~0,8%] %MSG%
echo [%TIME:~0,8%] %MSG% >> "%STATUS_FILE%"
goto :eof
