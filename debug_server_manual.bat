@echo off
cd server
node src/index.js > ..\server_debug_direct.txt 2>&1
