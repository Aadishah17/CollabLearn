@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "c:\Users\sseja\OneDrive\Desktop\CollabLearn\server"
node src/index.js > server_output.log 2>&1
