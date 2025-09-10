@echo off
echo ========================================
echo   PUSHING FASHION STOP TO GITHUB
echo ========================================
echo.
echo Step 1: Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/fashion-stop-ecommerce.git
echo.
echo Step 2: Push to GitHub
git branch -M main
git push -u origin main
echo.
echo ========================================
echo   SUCCESS! Your code is now on GitHub
echo ========================================
pause
