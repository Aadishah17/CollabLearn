@echo off
echo ============================================
echo  CollabLearn Diagnostic Startup
echo  %DATE% %TIME%
echo ============================================

echo.
echo [1/5] Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/5] Checking Node.js...
where node 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found in PATH
    echo Trying absolute path...
    "C:\Program Files\nodejs\node.exe" -v
    if %ERRORLEVEL% neq 0 (
        echo FATAL: Node.js not available
        pause
        exit /b 1
    )
)
node -v
npm -v

echo.
echo [3/5] Starting server...
cd /d "%~dp0server"
echo Current dir: %CD%
echo Starting server with output to ..\server_startup.log
start "COLLABLEARN_SERVER" cmd /c "node src/index.js > ..\server_startup.log 2>&1"
cd /d "%~dp0"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo.
echo [4/5] Checking server_startup.log...
if exist server_startup.log (
    echo --- Server Log ---
    type server_startup.log
    echo --- End Server Log ---
) else (
    echo WARNING: server_startup.log was not created
)

echo.
echo [5/5] Starting client...
cd /d "%~dp0client"
echo Current dir: %CD%
echo Starting client with output to ..\client_startup.log
start "COLLABLEARN_CLIENT" cmd /c "npx vite --host > ..\client_startup.log 2>&1"
cd /d "%~dp0"

echo Waiting 8 seconds for client to start...
timeout /t 8 /nobreak >nul

echo.
echo Checking client_startup.log...
if exist client_startup.log (
    echo --- Client Log ---
    type client_startup.log
    echo --- End Client Log ---
) else (
    echo WARNING: client_startup.log was not created
)

echo.
echo ============================================
echo  Startup complete! Check the logs above.
echo  Server: http://localhost:5001
echo  Client: http://localhost:5173
echo ============================================
pause
