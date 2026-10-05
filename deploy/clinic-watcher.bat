@echo off
setlocal EnableDelayedExpansion
:: ============================================================
::  deploy\clinic-watcher.bat
::
::  Runs every minute via Windows Task Scheduler (installed by
::  install-watcher.bat). Checks if the admin wrote the update
::  flag file; if so, runs update.bat and deletes the flag.
::
::  This is the Windows equivalent of the Linux systemd
::  clinic-update.path + clinic-update.service units.
:: ============================================================

set "ROOT=%~dp0.."
cd /d "%ROOT%"

set "FLAG=run\update.request"
set "LOG=run\watcher.log"

if not exist "run" mkdir run

if exist "%FLAG%" (
    echo [%DATE% %TIME%] Update request detected. >> "%LOG%"
    del /f /q "%FLAG%" >nul 2>&1
    call deploy\update.bat >> "%LOG%" 2>&1
    echo [%DATE% %TIME%] update.bat finished (exit !ERRORLEVEL!^). >> "%LOG%"
)
