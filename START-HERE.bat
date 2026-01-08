@echo off
color 0A
title Chat App Deployment Helper
cls

echo.
echo ========================================================
echo          CHAT APP - AUTOMATED DEPLOYMENT
echo ========================================================
echo.
echo Your app is 100%% ready to deploy!
echo Location: d:\empty folder\chat-app
echo.
echo ========================================================
echo.
echo OPTION 1: OPEN ALL DEPLOYMENT SITES (RECOMMENDED)
echo ========================================================
echo This will open:
echo   - GitHub (to create repository)
echo   - Railway (to deploy backend)
echo   - Vercel (to deploy frontend)
echo.
set /p choice1="Open all sites now? (Y/N): "
if /i "%choice1%"=="Y" (
    echo.
    echo Opening deployment sites...
    start https://github.com/new
    timeout /t 2 >nul
    start https://railway.app/new
    timeout /t 2 >nul
    start https://vercel.com/new
    echo.
    echo ✓ Sites opened in your browser!
    echo.
)

echo.
echo ========================================================
echo OPTION 2: VIEW STEP-BY-STEP COMMANDS
echo ========================================================
echo.
set /p choice2="Open command instructions? (Y/N): "
if /i "%choice2%"=="Y" (
    notepad "deploy-commands.txt"
)

echo.
echo ========================================================
echo OPTION 3: VIEW DETAILED GUIDES
echo ========================================================
echo.
echo Available guides:
echo   [1] QUICK-START.md     - 30-minute quick guide
echo   [2] DEPLOYMENT.md      - Detailed walkthrough
echo   [3] AUTO-DEPLOY.md     - Alternative methods
echo   [4] deploy-commands.txt - Copy-paste commands
echo.
set /p guide="Open a guide? (1-4 or N): "
if "%guide%"=="1" notepad "QUICK-START.md"
if "%guide%"=="2" notepad "DEPLOYMENT.md"
if "%guide%"=="3" notepad "AUTO-DEPLOY.md"
if "%guide%"=="4" notepad "deploy-commands.txt"

echo.
echo ========================================================
echo              QUICK REFERENCE
echo ========================================================
echo.
echo GitHub:  https://github.com/new
echo Railway: https://railway.app/
echo Vercel:  https://vercel.com/
echo.
echo Your local app: http://localhost:3000
echo.
echo ========================================================
echo.
echo Next steps:
echo 1. Create GitHub repository at https://github.com/new
echo 2. Follow commands in deploy-commands.txt
echo 3. Deploy to Railway and Vercel
echo 4. Your app will be live with a domain!
echo.
echo ========================================================
echo.
pause
