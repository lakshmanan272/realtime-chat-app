@echo off
color 0A
cls
echo ========================================
echo   FAST DEPLOYMENT - 10 MINUTES
echo ========================================
echo.
echo I'll help you deploy in 3 steps!
echo.
echo STEP 1: Fix Railway (2 minutes)
echo --------------------------------
echo 1. In Railway, click "realtime-chat-app" service
echo 2. Go to Settings tab
echo 3. Find "Root Directory"
echo 4. Set it to: server
echo 5. Go to Variables tab
echo 6. Click "RAW Editor"
echo 7. Paste this:
echo.
echo NODE_ENV=production
echo PORT=5000
echo JWT_SECRET=8f3b2a9c5d1e6g7h4i0j2k8l9m3n5o7p1q4r6s8t0u2v4w6x8y0z1a3b5c7d9e
echo JWT_EXPIRE=7d
echo FRONTEND_URL=https://temp.com
echo.
pause
echo.
echo STEP 2: Deploy Frontend with Vercel CLI (5 minutes)
echo ----------------------------------------------------
echo Running Vercel deploy now...
echo.
cd "d:\empty folder\chat-app\client"
vercel --prod
echo.
echo DONE! Copy your Vercel URL from above!
echo.
pause
echo.
echo STEP 3: Update Railway CORS (1 minute)
echo ---------------------------------------
echo 1. Go back to Railway
echo 2. Click your service
echo 3. Variables tab
echo 4. Update FRONTEND_URL to your Vercel URL
echo.
pause
echo.
echo ========================================
echo          ALL DONE! Test your app!
echo ========================================
pause
