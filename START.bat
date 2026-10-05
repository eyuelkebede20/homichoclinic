@echo off
setlocal EnableDelayedExpansion
title Bure Clinic - Startup

:: ============================================================
::  START.bat  -  Double-click this to start the clinic system
::  Place: repo root  (same folder as docker-compose.yml)
:: ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

call :header

:: ── 1. Check Docker is running ──────────────────────────────
docker info >nul 2>&1
if errorlevel 1 (
    echo   [!] Docker Desktop is not running.
    echo       Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo   [OK] Docker is running.

:: ── 2. Create runtime folders ───────────────────────────────
if not exist "run"     mkdir run
if not exist "backups" mkdir backups
echo   [OK] Runtime folders ready.

:: ── 3. Check .env exists ────────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo.
        echo   [!] .env was missing - copied from .env.example.
        echo       EDIT .env NOW with real passwords before continuing.
        echo.
        notepad .env
        echo   Press any key once you have saved .env...
        pause >nul
    ) else (
        echo   [!] .env not found. Create it before starting.
        pause
        exit /b 1
    )
)
echo   [OK] .env present.

:: ── 4. Install the update watcher (once) ────────────────────
schtasks /query /tn "ClinicUpdater" >nul 2>&1
if errorlevel 1 (
    echo   [..] Installing update watcher (Task Scheduler)...
    call deploy\install-watcher.bat silent
)

:: ── 5. Start the stack ──────────────────────────────────────
echo.
echo   [..] Starting clinic stack (first run builds the image - takes 2-4 min)...
echo.
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo   [!] docker compose failed. See errors above.
    pause
    exit /b 1
)

:: ── 6. Wait for healthy ─────────────────────────────────────
echo.
echo   [..] Waiting for app to become healthy...
set "TRIES=0"
:wait_loop
timeout /t 5 /nobreak >nul
set /a TRIES+=1
for /f "delims=" %%H in ('docker compose ps -q app 2^>nul') do (
    for /f "tokens=*" %%S in ('docker inspect -f "{{.State.Health.Status}}" %%H 2^>nul') do (
        if "%%S"=="healthy" goto :healthy
        echo       ... status: %%S  (!TRIES!/30)
    )
)
if !TRIES! lss 30 goto :wait_loop
echo   [!] App did not become healthy in 2.5 min. Check: docker compose logs app
pause
exit /b 1

:healthy
echo   [OK] App is healthy!

:: ── 7. Show the URL ─────────────────────────────────────────
call deploy\show-url.bat

echo.
echo   Press any key to close this window (the clinic keeps running).
pause >nul
exit /b 0

:: ── Subroutines ─────────────────────────────────────────────
:header
echo.
echo  =====================================================
echo    Bure Clinic Management System  -  Startup
echo  =====================================================
echo.
goto :eof
