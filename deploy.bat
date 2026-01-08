@echo off
echo ========================================
echo   Chat App Deployment Helper
echo ========================================
echo.

echo Step 1: Check Git Status
echo ------------------------
git status
echo.

echo Step 2: Instructions
echo -------------------
echo.
echo Your code is ready to deploy!
echo.
echo Next steps:
echo 1. Create a GitHub repository at: https://github.com/new
echo    - Name it: realtime-chat-app
echo    - Keep it Public
echo    - Do NOT initialize with README
echo.
echo 2. Run these commands (replace YOUR-USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR-USERNAME/realtime-chat-app.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Then follow DEPLOYMENT.md for Railway and Vercel setup
echo.
echo ========================================
echo.
pause
