@echo off
echo Checking port 5001 (Server)...
netstat -ano | findstr ":5001"
if %ERRORLEVEL% EQU 0 (
    echo Port 5001 is OPEN
) else (
    echo Port 5001 is CLOSED
)

echo Checking port 5173 (Client)...
netstat -ano | findstr ":5173"
if %ERRORLEVEL% EQU 0 (
    echo Port 5173 is OPEN
) else (
    echo Port 5173 is CLOSED
)
