@echo off
title Bure Clinic - Startup

REM  Self-update and relaunch block. Wrapped in ( ) so CMD reads it all at once
REM  before git pull can change the file on disk.
(
    if /i not "%~1"=="child" (
        echo   [..] Checking for system updates from GitHub...
        git rev-parse HEAD > .git-old 2>nul
        git stash >nul 2>&1
        git pull origin main
        if errorlevel 1 (
            echo   [!] Error: Failed to pull latest changes. Stopping.
            pause
            exit /b 1
        )
        git rev-parse HEAD > .git-new 2>nul
        echo.
        fc .git-old .git-new >nul 2>&1
        if errorlevel 1 (
            cmd /k ""%~f0" child --updated"
        ) else (
            cmd /k ""%~f0" child"
        )
        exit /b
    )
)

:main

REM ============================================================
REM  START.bat  -  Double-click this to start the clinic system
REM  Place: repo root (same folder as docker-compose.yml)
REM
REM  What it does, in order:
REM    1. Makes sure Docker Desktop is installed and running
REM       (starts it automatically if it is closed)
REM    2. Creates the run and backups and logs folders
REM    3. Makes sure .env exists and has real passwords
REM    4. Installs the update watcher once (Task Scheduler)
REM       so the admin Update button works
REM    5. Starts the database and the app with docker compose
REM    6. Waits until the app reports healthy
REM    7. Shows the address to open from the clinic PCs
REM
REM  While it works you will see a spinner, a moving bar and a
REM  timer, so you always know it is alive and not frozen.
REM  Set USE_COLOR=0 below if you see strange characters.
REM
REM  If the window ever closes by itself, open logs\startup-history.log.
REM  The last "step" line shows where it stopped.
REM
REM  Safe to run again at any time. Running it on an already
REM  running system just rebuilds if needed and re-checks health.
REM
REM  To STOP the system:   docker compose down
REM  WARNING: never add -v to that command. It deletes the
REM  database volume, which means ALL patient data is lost.
REM
REM  Every start, success and failure is logged with a time
REM  stamp to logs\startup-history.log (useful for tracking
REM  downtime and restarts). Docker build output is saved to
REM  logs\compose.log.
REM
REM  NOTE: save this file as plain ANSI or UTF-8 WITHOUT BOM.
REM  Keep it ASCII only, otherwise cmd may misread it.
REM ============================================================

set "USE_COLOR=1"

set "ROOT=%~dp0"
cd /d "%ROOT%"

if not exist "logs" mkdir logs
echo %date% %time% - START requested>> "logs\startup-history.log"

REM ------------------------------------------------------------
REM  Animation helpers: carriage return, colors, bar patterns
REM ------------------------------------------------------------
for /f %%a in ('copy /Z "%~dpf0" nul') do set "CR=%%a"

set "ESC="
set "G=" & set "R=" & set "Y=" & set "C=" & set "Z="
if "%USE_COLOR%"=="1" for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
if defined ESC (
    set "G=%ESC%[92m"
    set "R=%ESC%[91m"
    set "Y=%ESC%[93m"
    set "C=%ESC%[96m"
    set "Z=%ESC%[0m"
)

set "PAT=..........##.........."
set "FULL=#######"
set "EMPTY=......."
set "B12=            "
set "BLANK=%B12%%B12%%B12%%B12%%B12%%B12%"
set "F=0"

call :header

REM ------------------------------------------------------------
REM  1. Docker check
REM ------------------------------------------------------------
call :stephdr 1 "Checking Docker"

where docker >nul 2>&1
if errorlevel 1 (
    echo   %R%[!] Docker is not installed on this computer.%Z%
    echo       Install Docker Desktop from docker.com, restart the PC,
    echo       then run this file again.
    echo %date% %time% - FAILED: docker not installed>> "logs\startup-history.log"
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if not errorlevel 1 goto :docker_ok

set "DD=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if exist "%DD%" goto :start_docker

set "DD=%LOCALAPPDATA%\Docker\Docker\Docker Desktop.exe"
if not exist "%DD%" goto :docker_fail

:start_docker

echo   %Y%[..]%Z% Docker Desktop is not running - starting it now.
echo        This can take 1-2 minutes after a reboot.
echo.
start "" "%DD%"
call :mark
set "N=0"

:docker_wait
call :frame "Waiting for Docker Desktop"
call :sleep
set /a M=N%%20
set /a N+=1
if %M% neq 0 goto :docker_wait
docker info >nul 2>&1
if not errorlevel 1 goto :docker_up
if %EL% lss 120 goto :docker_wait
call :clearline
goto :docker_fail

:docker_up
call :clearline

:docker_fail_check
docker info >nul 2>&1
if not errorlevel 1 goto :docker_ok

:docker_fail
echo.
echo   %R%[!] Docker Desktop is not running and could not be started.%Z%
echo       Open Docker Desktop manually, wait until it says
echo       "Engine running", then run this file again.
echo %date% %time% - FAILED: docker not running>> "logs\startup-history.log"
echo.
pause
exit /b 1

:docker_ok
echo   %G%[OK]%Z% Docker is running.

REM ------------------------------------------------------------
REM  2. Runtime folders
REM     run     = where the Update button drops its request file
REM     backups = database backups made before every update
REM ------------------------------------------------------------
call :stephdr 2 "Preparing folders"
if not exist "run"     mkdir run
if not exist "backups" mkdir backups
echo   %G%[OK]%Z% Folders ready: run, backups, logs.

REM ------------------------------------------------------------
REM  3. .env check
REM     .env holds the database password. It is never committed
REM     to Git, so a fresh copy of the project will not have it.
REM ------------------------------------------------------------
call :stephdr 3 "Checking .env settings"

if exist ".env" goto :env_check

if not exist ".env.example" (
    echo   %R%[!] Neither .env nor .env.example was found.%Z%
    echo       Restore .env.example from the repository, then run again.
    echo %date% %time% - FAILED: no .env and no .env.example>> "logs\startup-history.log"
    echo.
    pause
    exit /b 1
)

copy ".env.example" ".env" >nul
echo.
echo   %Y%[!] .env was missing - created from .env.example.%Z%
echo       Set a real DB_PASSWORD now. Use a long random value.
echo       Save the file and close Notepad to continue.
echo.
start /wait notepad ".env"

:env_check
findstr /i /c:"change-me" ".env" >nul 2>&1
if not errorlevel 1 (
    echo   %R%[!] .env still contains the placeholder password "change-me".%Z%
    echo       Open .env, replace it with a real password, save, and run
    echo       this file again.
    echo %date% %time% - FAILED: placeholder password in .env>> "logs\startup-history.log"
    echo.
    start /wait notepad ".env"
    pause
    exit /b 1
)
echo   %G%[OK]%Z% .env present and configured.

REM ------------------------------------------------------------
REM  4. Update watcher
REM     Installed once. It watches run\update.request, which the
REM     admin Update button creates, and then runs the updater.
REM     Installing a scheduled task can need Administrator rights.
REM ------------------------------------------------------------
call :stephdr 4 "Checking update watcher"

schtasks /query /tn "ClinicUpdater" >nul 2>&1
if not errorlevel 1 goto :watcher_ok

if not exist "deploy\install-watcher.bat" (
    echo   %Y%[!] deploy\install-watcher.bat was not found.%Z%
    echo       The clinic will run, but the admin Update button will not work.
    goto :watcher_done
)

echo   %Y%[..]%Z% Installing the update watcher in Task Scheduler...
cmd /c ""deploy\install-watcher.bat" silent"
if errorlevel 1 (
    echo   %Y%[!] Could not install the update watcher.%Z%
    echo       Right-click START.bat and choose Run as administrator once.
    echo       The clinic will still start; only the Update button is affected.
) else (
    echo   %G%[OK]%Z% Update watcher installed.
)
goto :watcher_done

:watcher_ok
echo   %G%[OK]%Z% Update watcher already installed.

:watcher_done

REM ------------------------------------------------------------
REM  5. Start the stack
REM     docker compose runs in the background so the screen can
REM     keep animating. Its output goes to logs\compose.log and
REM     its result code to logs\compose.done.
REM     First run downloads Postgres and builds the app.
REM ------------------------------------------------------------
call :stephdr 5 "Starting the clinic system"
echo         First run takes 2-4 minutes. Later starts about 30 seconds.
echo.

REM Detect the true outbound IPv4 address (ignores Docker/WSL virtual adapters)
set "LAN_IP=localhost"
for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "try { @((Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias (Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric | Select-Object -ExpandProperty InterfaceAlias -First 1) -ErrorAction Stop).IPAddress)[0] } catch { 'localhost' }"`) do set "LAN_IP=%%I"
echo   [..] Configuring system for network access on IP: %LAN_IP%

echo   [..] Starting containers ^(building if code changed^)...
echo.
git rev-parse --short HEAD > version.txt 2>nul
docker compose up -d --build
if errorlevel 1 goto :compose_fail

echo.
echo   %G%[OK]%Z% Containers started.
goto :compose_ok

:compose_fail
echo.
echo   %R%[!] docker compose failed.%Z%
echo.
echo       Current container state:
docker compose ps
echo.
echo       Common causes: port 3000 already in use, a typo in .env,
echo       or no internet on the first build.
echo %date% %time% - FAILED: docker compose up>> "logs\startup-history.log"
echo.
pause
exit /b 1

:compose_ok

REM ------------------------------------------------------------
REM  6. Wait for healthy (up to 150 seconds)
REM     Shows the live status of the database and of the app.
REM ------------------------------------------------------------
call :stephdr 6 "Waiting for the app to become healthy"
echo.

set "DBS=starting"
set "APS=starting"
set "N=0"
call :mark

:health_wait
call :frame "Database: %DBS%  App: %APS%"
call :sleep
set /a M=N%%20
set /a N+=1
if %M%==0 call :svc_status db DBS
if %M%==0 call :svc_status app APS
if "%APS%"=="healthy" goto :healthy
if %EL% lss 150 goto :health_wait

call :clearline
echo   %R%[!] The app did not become healthy within 2.5 minutes.%Z%
echo       Last lines of the app log:
echo.
docker compose logs --tail 30 app
echo.
echo       Full log:  docker compose logs app
echo       Database:  docker compose logs db
echo %date% %time% - FAILED: app not healthy>> "logs\startup-history.log"
echo.
pause
exit /b 1

:healthy
call :clearline
echo   %G%[OK]%Z% Database and app are healthy after %EM%:%ES%.
echo %date% %time% - OK: app healthy>> "logs\startup-history.log"

REM ------------------------------------------------------------
REM  7. Show the address for the clinic PCs
REM     Uses deploy\show-url.bat if present, otherwise a
REM     built-in fallback that reads this PC's IPv4 address.
REM ------------------------------------------------------------
call :stephdr 7 "Access addresses"
if exist "deploy\show-url.bat" (
    call "deploy\show-url.bat"
    goto :url_done
)

set "APP_PORT=3000"
for /f "tokens=1,* delims==" %%A in ('findstr /b /c:"APP_PORT=" ".env"') do set "APP_PORT=%%B"
echo.
echo   From any clinic PC on the same network, open:
echo         %C%http://%LAN_IP%:%APP_PORT%%Z%
echo.
echo   On this PC you can also use:  %C%http://localhost:%APP_PORT%%Z%

:url_done
echo.
echo  %G%=====================================================%Z%
echo  %G%   THE CLINIC SYSTEM IS READY%Z%
echo  %G%=====================================================%Z%
echo.
echo   Tip: give this PC a fixed IP address in your router so the
echo        address above never changes.
echo.
echo   Press any key to close this window. The clinic keeps running.
pause >nul
exit 0

REM ============================================================
REM  Subroutines (only reached through call)
REM ============================================================

:header
echo.
echo  %C%=====================================================%Z%
echo  %C%  Bure Clinic Management System  -  Startup%Z%
echo  %C%=====================================================%Z%
goto :eof

REM  :stephdr  number  "text"   prints an overall progress bar
:stephdr
set /a K=%~1
echo %date% %time% - step %~1: %~2>> "logs\startup-history.log"
call set "A=%%FULL:~0,%K%%%"
call set "B=%%EMPTY:~%K%%%"
echo.
echo   %C%[%A%%B%]%Z% Step %~1 of 7 - %~2
goto :eof

REM  :frame "message"   draws ONE animation frame on the same line
:frame
call :tick
set /a F=(F+1)%%20
set "POS=%F%"
if %POS% gtr 10 set /a POS=20 - POS
call set "BAR=%%PAT:~%POS%,12%%"
<nul set /p "=%ESC%[1G   %C%*%Z% %~1  [%BAR%] %EM%:%ES%    "
goto :eof

REM  :clearline   erases the animated line
:clearline
<nul set /p "=%ESC%[1G%BLANK%%ESC%[1G"
goto :eof

REM  :sleep   waits about a quarter of a second
:sleep
ping 192.0.2.1 -n 1 -w 250 >nul 2>&1
goto :eof

REM  :mark   remembers the current time as the phase start
:mark
set "T=%time: =0%"
set /a T0=(1%T:~0,2%-100)*3600+(1%T:~3,2%-100)*60+(1%T:~6,2%-100)
set "EL=0"
set "EM=0"
set "ES=00"
goto :eof

REM  :tick   updates EL, EM, ES (elapsed since :mark)
:tick
set "T=%time: =0%"
set /a NOW=(1%T:~0,2%-100)*3600+(1%T:~3,2%-100)*60+(1%T:~6,2%-100)
set /a EL=NOW-T0
if %EL% lss 0 set /a EL+=86400
set /a EM=EL/60
set /a ES=EL%%60
if %ES% lss 10 set "ES=0%ES%"
goto :eof

REM  :svc_status  service  outvar   sets outvar to starting/healthy/unhealthy
:svc_status
set "%~2=starting"
set "CID="
for /f %%H in ('docker compose ps -q %~1 2^>nul') do set "CID=%%H"
if not defined CID goto :eof
for /f %%S in ('docker inspect -f "{{.State.Health.Status}}" %CID% 2^>nul') do set "%~2=%%S"
goto :eof