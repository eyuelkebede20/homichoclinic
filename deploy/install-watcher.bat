@echo off
setlocal EnableDelayedExpansion
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

:: Use PowerShell to create the task with a proper repeat trigger.
:: schtasks /create alone cannot set RepetitionInterval on an OnLogon trigger.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$action  = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c \"%WATCHER%\"' -WorkingDirectory '%ROOT%';" ^
  "$trigger = New-ScheduledTaskTrigger -AtLogOn;" ^
  "$trigger.Repetition = (New-Object Microsoft.Win32.TaskScheduler.RepetitionPattern -ArgumentList ([TimeSpan]::FromMinutes(1), [TimeSpan]::Zero) 2>$null);" ^
  "try { $trigger.Repetition.Interval = 'PT1M'; $trigger.Repetition.Duration = '' } catch {};" ^
  "$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::FromMinutes(10));" ^
  "$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest;" ^
  "Unregister-ScheduledTask -TaskName 'ClinicUpdater' -Confirm:$false -ErrorAction SilentlyContinue;" ^
  "Register-ScheduledTask -TaskName 'ClinicUpdater' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null;" ^
  "Write-Host '  [OK] Task installed.'" ^
  2>nul

if errorlevel 1 (
    :: Fallback: plain schtasks (no repeat — user can add repeat in Task Scheduler)
    schtasks /delete /tn "ClinicUpdater" /f >nul 2>&1
    schtasks /create /tn "ClinicUpdater" /tr "cmd /c \"%WATCHER%\"" /sc onlogon /rl highest /f >nul 2>&1
    if errorlevel 1 (
        echo   [!] Could not install task. Run as Administrator and try again.
        if not "%SILENT%"=="silent" pause
        exit /b 1
    )
    echo   [OK] Task installed (basic - no repeat trigger).
    echo        Open Task Scheduler and set Repeat: every 1 minute.
)

if not "%SILENT%"=="silent" (
    echo.
    echo   Verify in Task Scheduler (taskschd.msc^) under Task Scheduler Library.
    echo.
    pause
)
exit /b 0
