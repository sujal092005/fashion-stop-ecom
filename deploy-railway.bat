@echo off
echo ========================================
echo   FASHION STOP - RAILWAY DEPLOYMENT
echo ========================================
echo.
echo Step 1: Login to Railway (opens browser)
railway login
echo.
echo Step 2: Initialize Railway project
railway init
echo.
echo Step 3: Deploy your Fashion Stop website
railway up
echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo   Your website will be live shortly at:
echo   https://fashion-stop-production.up.railway.app
echo ========================================
pause
