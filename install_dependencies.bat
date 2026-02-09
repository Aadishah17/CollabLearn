@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"
echo Installing Server Dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Server install failed
    exit /b %ERRORLEVEL%
)
cd ..
echo Installing Client Dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Client install failed
    exit /b %ERRORLEVEL%
)
cd ..
echo Done.
