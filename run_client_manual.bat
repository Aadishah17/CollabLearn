@echo off
echo Starting CollabLearn Client...
SET "PATH=%PATH%;C:\Program Files\nodejs"
cd client
echo Using NPM at: "C:\Program Files\nodejs\npm.cmd"
call "C:\Program Files\nodejs\npm.cmd" run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Client crashed or failed to start!
    pause
)
pause
