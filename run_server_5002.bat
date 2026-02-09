@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"
SET "PORT=5002"
echo Starting Server on Port 5002...
cd server
call npm run dev
