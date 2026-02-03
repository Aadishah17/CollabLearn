@echo off
echo ==========================================
echo COLLABLEARN LAUNCHER DIAGNOSTICS
echo ==========================================
echo Current Directory: %CD%
echo.
echo Checking Node.js version...
node -v
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT found or not working!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit
)
echo Node.js is working.
echo.
echo Checking npm version...
call npm -v
if %errorlevel% neq 0 (
    echo [ERROR] npm is NOT found!
    pause
    exit
)
echo npm is working.
echo.
echo ==========================================
echo LAUNCHING APPLICATIONS
echo ==========================================
echo.
echo 1. Starting Server (Output will be in a new window)...
start "CollabLearn Server" cmd /k "cd server && echo Starting Server... && npm run dev || echo [ERROR] Server crashed! && pause"

echo 2. Starting Client (Output will be in a new window)...
start "CollabLearn Client" cmd /k "cd client && echo Starting Client... && npm run dev || echo [ERROR] Client crashed! && pause"

echo.
echo Done! Please check the two new windows.
echo If they close immediately, there is a system issue.
echo.
pause
