@echo off
echo Starting CollabLearn Server...
SET "PATH=%PATH%;C:\Program Files\nodejs"
cd server
echo Using NPM at: "C:\Program Files\nodejs\npm.cmd"
call "C:\Program Files\nodejs\npm.cmd" run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server crashed or failed to start!
    pause
)
pause
