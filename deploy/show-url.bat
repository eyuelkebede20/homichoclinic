@echo off
setlocal EnableDelayedExpansion
:: ============================================================
::  deploy\show-url.bat
::  Prints the clinic LAN URL to the console.
::  Called by START.bat and can be double-clicked standalone.
:: ============================================================

set "ROOT=%~dp0.."
cd /d "%ROOT%"

:: Read APP_PORT from .env (default 3000)
set "APP_PORT=3000"
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if "%%A"=="APP_PORT" set "APP_PORT=%%B"
    )
)

:: Get the primary LAN IPv4 (skip loopback 127.x)
set "LAN_IP="
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /r "IPv4.*[0-9][0-9]*\.[0-9]" ^| findstr /v "127\."') do (
    if not defined LAN_IP (
        for /f "tokens=* delims= " %%T in ("%%I") do set "LAN_IP=%%T"
    )
)
if not defined LAN_IP set "LAN_IP=^<check-ipconfig^>"

echo.
echo  =====================================================
echo    Open this address on ANY PC in the clinic:
echo.
echo      http://!LAN_IP!:!APP_PORT!
echo.
echo  =====================================================
echo.

:: Quick health check
curl -sf "http://!LAN_IP!:!APP_PORT!/api/health" >nul 2>&1
if errorlevel 1 (
    echo   Status: Starting up / Offline  (Docker may still be booting^)
) else (
    echo   Status: ONLINE
)
echo.
