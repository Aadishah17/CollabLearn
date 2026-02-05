@echo off
echo ==========================================
echo LAUNCHING COLLABLEARN
echo ==========================================
echo.
echo Launching Server...
start "CollabLearn Server" cmd /c "call run_server_manual.bat"

echo Launching Client...
start "CollabLearn Client" cmd /c "call run_client_manual.bat"

echo.
echo Launch commands issued.
echo Checks the popup windows for status.
echo.
pause
