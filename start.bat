@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"

echo ==========================================
echo COLLABLEARN STARTUP
echo ==========================================

echo [1] Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM nodemon.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2] Clearing ports 5001 and 5173...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173,5001 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"
timeout /t 1 /nobreak >nul

echo [3] Starting Server on port 5001...
start "COLLABLEARN SERVER" cmd /k "cd /d %~dp0server && set PATH=C:\Program Files\nodejs;%PATH% && node src/index.js"

echo [4] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [5] Starting Client on port 5173...
start "COLLABLEARN CLIENT" cmd /k "cd /d %~dp0client && set PATH=C:\Program Files\nodejs;%PATH% && node node_modules\vite\bin\vite.js"

echo.
echo ==========================================
echo STARTUP COMPLETE
echo ==========================================
echo.
echo Server window: "COLLABLEARN SERVER"
echo Client window: "COLLABLEARN CLIENT"
echo.
echo Web app: http://localhost:5173
echo API:     http://localhost:5001
echo.
echo If a window closed immediately, it means there was an error.
echo Check the window title bar for details.
echo.
pause
