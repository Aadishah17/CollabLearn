@echo off
cd server
start /B "ServerLog" cmd /c ""C:\Program Files\nodejs\node.exe" src/index.js > ..\server_debug_out.txt 2>&1"
cd ..\client
start /B "ClientLog" cmd /c ""C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js > ..\client_debug_out.txt 2>&1"
