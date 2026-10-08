@echo off
title Bure Clinic - Update and Database Sync
setlocal enabledelayedexpansion

echo ==========================================================
echo         Bure Clinic - Update ^& Setup Script (Local)
echo ==========================================================
echo.
echo This script will pull the latest changes, update dependencies,
echo and synchronize your local database.
echo.

echo [1/5] Stashing local changes (if any)...
call git stash
echo.

echo [2/5] Pulling latest code from GitHub...
call git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] Failed to pull the latest changes. Please check your git connection.
    exit /b %errorlevel%
)
echo.

echo [3/5] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo [!] pnpm install failed or pnpm not found. Trying npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies with both pnpm and npm.
        
        exit /b 1
    )
)
echo.

echo [4/5] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma Client.
    
    exit /b %errorlevel%
)
echo.

echo [5/5] Synchronizing Database Schema...
echo (Note: Using db push --accept-data-loss to ensure schema matches perfectly)
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo [ERROR] Failed to sync database schema. Make sure your database is running.
    
    exit /b %errorlevel%
)
echo.

echo ==========================================================
echo               UPDATE COMPLETE SUCCESSFULLY!
echo ==========================================================
echo.
echo 1. Start your application by running:
echo    npm run dev   (or pnpm dev)
echo.
echo 2. Open your browser and go to:
echo    http://localhost:3000/api/seed-db
echo    (This will create the default admin user and roles)
echo.
echo ==========================================================

