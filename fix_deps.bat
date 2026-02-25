@echo off
SET "NODE_PATH=C:\Program Files\nodejs"
SET "PATH=%NODE_PATH%;%PATH%"

echo Fixing client node_modules...
cd c:\Users\sseja\OneDrive\Desktop\CollabLearn\client
if exist node_modules rmdir node_modules
if not exist D:\CollabLearn_Deps\client mkdir D:\CollabLearn_Deps\client
mklink /J node_modules D:\CollabLearn_Deps\client
call npm install --legacy-peer-deps > client_install.log 2>&1

echo Fixing server node_modules...
cd c:\Users\sseja\OneDrive\Desktop\CollabLearn\server
if exist node_modules rmdir node_modules
if not exist D:\CollabLearn_Deps\server mkdir D:\CollabLearn_Deps\server
mklink /J node_modules D:\CollabLearn_Deps\server
call npm install > server_install.log 2>&1

echo Done!
