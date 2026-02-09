@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"
echo Starting Server in Debug Mode...
cd server
call npm run dev
