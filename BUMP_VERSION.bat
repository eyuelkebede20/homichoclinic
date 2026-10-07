@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo   Bure Clinic - Version Management
echo =====================================================
echo.
echo Current Version:
node -p "require('./package.json').version"
echo.

echo Choose the type of version bump:
echo 1) Patch (0.0.x) - Bug fixes and minor tweaks
echo 2) Minor (0.x.0) - New features
echo 3) Major (x.0.0) - Major system overhaul
echo 4) Cancel
echo.

set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" (
    set BUMP_TYPE=patch
) else if "%choice%"=="2" (
    set BUMP_TYPE=minor
) else if "%choice%"=="3" (
    set BUMP_TYPE=major
) else (
    echo Version bump cancelled.
    pause
    exit /b
)

echo.
echo Bumping %BUMP_TYPE% version...
call pnpm version %BUMP_TYPE% --no-git-tag-version

echo.
echo New Version is now:
node -p "require('./package.json').version"
echo.

set /p push="Do you want to commit and push this new version to GitHub? (Y/N): "
if /i "%push%"=="Y" (
    for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set NEW_VER=%%v
    git add package.json
    git commit -m "chore: bump version to v!NEW_VER!"
    git push origin main
    echo Successfully pushed v!NEW_VER! to GitHub!
)

echo.
echo Done! Please restart the app for the new version badge to show in the UI.
pause
