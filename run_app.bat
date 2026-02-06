@echo off
echo ==========================================
echo LAUNCHING COLLABLEARN (ROBUST MODE)
echo ==========================================
echo.

SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"

echo Checking Ports...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173, 5001 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"

echo Launching Server...
cd server
start "CollabLearn Server" cmd /c "call npm run dev"
cd ..

echo Launching Client...
cd client
start "CollabLearn Client" cmd /c "call npm run dev"
cd ..

echo.
echo Launch commands issued.
echo Application should be available at http://localhost:5173
echo.
pause
