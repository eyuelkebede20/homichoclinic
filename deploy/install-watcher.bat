@echo off
setlocal EnableDelayedExpansion

:: Auto-elevate to Administrator
net session >nul 2>&1
if not %errorLevel% == 0 (
    echo [!] Requesting Administrative privileges...
    powershell -Command "Start-Process -FilePath '%0' -ArgumentList '%*' -Verb RunAs"
    exit /b
)
:: ============================================================
::  deploy\install-watcher.bat
::
::  Installs the "ClinicUpdater" Windows Scheduled Task.
::  The task runs clinic-watcher.bat every minute, indefinitely,
::  starting at logon — so Docker Desktop (which needs a user
::  session) is already running.
::
::  Usage:
::    install-watcher.bat          - interactive
::    install-watcher.bat silent   - no pause (called by START.bat)
::
::  Requires: PowerShell 5+ (built into Windows 10/11)
:: ============================================================

set "ROOT=%~dp0.."
set "SILENT=%~1"

:: Resolve absolute path to watcher
pushd "%ROOT%"
set "ROOT=%CD%"
popd
set "WATCHER=%ROOT%\deploy\clinic-watcher.bat"

echo   [..] Installing ClinicUpdater scheduled task...

schtasks /delete /tn "ClinicUpdater" /f >nul 2>&1
schtasks /create /tn "ClinicUpdater" /tr "cmd /c \"%WATCHER%\"" /sc minute /mo 1 /f >nul 2>&1

if errorlevel 1 (
    echo   [!] Could not install task. Try running as Administrator.
    if not "%SILENT%"=="silent" pause
    exit /b 1
)

echo   [OK] Task installed successfully.

if not "%SILENT%"=="silent" (
    echo.
    echo   Verify in Task Scheduler (taskschd.msc^) under Task Scheduler Library.
    echo.
    pause
)
exit /b 0
