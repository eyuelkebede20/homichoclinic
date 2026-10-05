@echo off
setlocal EnableDelayedExpansion
:: ============================================================
::  deploy\static-ip.bat
::  Set a static LAN IP on the clinic server (Windows).
::
::  Run as Administrator (right-click → "Run as administrator").
::  Run ONCE during initial setup.
:: ============================================================

net session >nul 2>&1
if errorlevel 1 (
    echo  [!] This script must be run as Administrator.
    echo      Right-click it and choose "Run as administrator".
    pause
    exit /b 1
)

echo.
echo  =====================================================
echo    Bure Clinic - Static IP Setup
echo  =====================================================
echo.

:: ── Detect current active adapter and IP ────────────────────
:: Find the adapter that has a default gateway (the LAN adapter)
set "ADAPTER="
set "CURRENT_IP="
set "GATEWAY="
set "SUBNET="

for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "Get-NetRoute -DestinationPrefix 0.0.0.0/0 | Sort-Object RouteMetric | Select-Object -First 1 | ForEach-Object { $_.InterfaceIndex }" ^
    2^>nul') do set "IF_INDEX=%%L"

for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "Get-NetAdapter -InterfaceIndex !IF_INDEX! | Select-Object -ExpandProperty Name" ^
    2^>nul') do set "ADAPTER=%%L"

for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "Get-NetIPAddress -InterfaceIndex !IF_INDEX! -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress" ^
    2^>nul') do set "CURRENT_IP=%%L"

for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "Get-NetIPAddress -InterfaceIndex !IF_INDEX! -AddressFamily IPv4 | Select-Object -ExpandProperty PrefixLength" ^
    2^>nul') do set "PREFIX=%%L"

for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "Get-NetRoute -DestinationPrefix 0.0.0.0/0 -InterfaceIndex !IF_INDEX! | Sort-Object RouteMetric | Select-Object -First 1 -ExpandProperty NextHop" ^
    2^>nul') do set "GATEWAY=%%L"

:: Convert prefix length to subnet mask
for /f "tokens=*" %%L in ('powershell -NoProfile -Command ^
    "$p=!PREFIX!; $mask=([Math]::Pow(2,32)-[Math]::Pow(2,32-$p)); [Net.IPAddress]::Parse([String]$mask).ToString()" ^
    2^>nul') do set "SUBNET=%%L"

echo   Detected settings:
echo     Adapter  : !ADAPTER!
echo     IP       : !CURRENT_IP! / !PREFIX!
echo     Subnet   : !SUBNET!
echo     Gateway  : !GATEWAY!
echo.
echo   These values will be locked as your static IP.
set /p "CONFIRM=  Continue? [Y/N]: "
if /i not "!CONFIRM!"=="Y" (
    echo   Aborted.
    pause
    exit /b 0
)

:: ── Apply static IP via netsh ────────────────────────────────
echo.
echo   [..] Setting static IP...
netsh interface ip set address name="!ADAPTER!" static !CURRENT_IP! !SUBNET! !GATEWAY!
if errorlevel 1 (
    echo   [!] Failed to set IP. Try manually in:
    echo       Control Panel → Network → Adapter Settings → Properties → IPv4
    pause
    exit /b 1
)

echo   [..] Setting DNS (Google 8.8.8.8 + 8.8.4.4)...
netsh interface ip set dns name="!ADAPTER!" static 8.8.8.8
netsh interface ip add dns name="!ADAPTER!" 8.8.4.4 index=2

echo.
echo  =====================================================
echo    Static IP set successfully!
echo.
echo    Clinic URL:  http://!CURRENT_IP!:3000
echo    Share this address with all clinic client PCs.
echo  =====================================================
echo.
echo   NOTE: If this server ever gets a new network card,
echo         re-run this script to lock the new adapter.
echo.
pause
