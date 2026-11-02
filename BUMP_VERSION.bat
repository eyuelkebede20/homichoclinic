@echo off
setlocal EnableDelayedExpansion
title Bure Clinic - Version Management

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "CURRENT_VER="
if exist "VERSION" (
    set /p CURRENT_VER=<VERSION
)
if "!CURRENT_VER!"=="" (
    for /f "delims=" %%v in ('node -e "try { console.log(require('./package.json').version); } catch(e) { console.log('0.1.29'); }"') do set "CURRENT_VER=%%v"
)

echo =====================================================
echo   Bure Clinic ERP - Version Management System
echo =====================================================
echo.
echo Current Version: !CURRENT_VER!
echo.
echo Choose the type of version bump:
echo 1) Patch - Bug fixes and minor clinical tweaks
echo 2) Minor - New features (e.g. lab, pharmacy, reports)
echo 3) Major - Major system overhaul / breaking changes
echo 4) Custom - Enter a specific version string
echo 5) Cancel
echo.

set /p choice="Enter choice [1-5]: "

if "%choice%"=="5" (
    echo Version bump cancelled.
    exit /b 0
)

for /f "tokens=1,2,3 delims=." %%a in ("!CURRENT_VER!") do (
    set "MAJOR=%%a"
    set "MINOR=%%b"
    set "PATCH=%%c"
)

if "%choice%"=="1" (
    set /a PATCH+=1
    set "NEW_VER=!MAJOR!.!MINOR!.!PATCH!"
) else if "%choice%"=="2" (
    set /a MINOR+=1
    set "NEW_VER=!MAJOR!.!MINOR!.0"
) else if "%choice%"=="3" (
    set /a MAJOR+=1
    set "NEW_VER=!MAJOR!.0.0"
) else if "%choice%"=="4" (
    set /p NEW_VER="Enter custom version (e.g. 0.2.0): "
    if "!NEW_VER!"=="" (
        echo Invalid version. Cancelled.
        exit /b 1
    )
) else (
    echo Version bump cancelled.
    exit /b 0
)

echo.
echo Bumping version: !CURRENT_VER! -^> !NEW_VER!...

REM 1. Update VERSION file
echo !NEW_VER!> VERSION

REM 2. Update package.json
node -e "const fs = require('fs'); const p = './package.json'; if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf-8')); j.version = '!NEW_VER!'; j.name = 'bure-clinic'; fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n'); }"

REM 3. Resolve git hash and stamp version.json & version.txt
set "GIT_HASH=unknown"
for /f "tokens=*" %%h in ('git rev-parse --short HEAD 2^>nul') do set "GIT_HASH=%%h"
echo !GIT_HASH!> version.txt

node -e "const fs = require('fs'); const info = { name: 'Bure Clinic ERP', version: '!NEW_VER!', gitCommit: '!GIT_HASH!', buildTime: new Date().toISOString() }; fs.writeFileSync('./version.json', JSON.stringify(info, null, 2) + '\n');"

echo.
echo [OK] Successfully bumped version to !NEW_VER!!
echo      - VERSION updated
echo      - package.json updated
echo      - version.json stamped
echo      - version.txt synced
echo.

set /p commit="Do you want to create a Git release commit and tag? (Y/N): "
if /i "%commit%"=="Y" (
    git add VERSION package.json version.json
    git commit -m "chore(release): bump version to v!NEW_VER!"
    git tag -a "v!NEW_VER!" -m "Release v!NEW_VER!"
    echo [OK] Created commit and tag v!NEW_VER!!
    echo.
    set /p push="Do you want to push to GitHub (origin main --tags)? (Y/N): "
    if /i "!push!"=="Y" (
        git push origin main
        git push origin "v!NEW_VER!"
        echo [OK] Pushed v!NEW_VER! to GitHub!
    )
)

echo.
echo =====================================================
echo   Version bump to v!NEW_VER! complete!
echo =====================================================
pause
