@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"
echo Starting Client in Debug Mode...
cd client
call npm run dev
