@echo off
echo ==========================================
echo DEBUG MODE - KEEPING WINDOWS OPEN
echo ==========================================

echo Starting Server...
cd server
start "DEBUG SERVER - CHECK FOR ERRORS" cmd /k "echo Server Directory & cd & node -v & npm -v & echo Starting Server... & npm run dev"

cd ..
echo Starting Client...
cd client
start "DEBUG CLIENT - CHECK FOR ERRORS" cmd /k "echo Client Directory & cd & node -v & npm -v & echo Starting Client... & npm run dev"

echo.
echo Please check the two new windows.
echo If they close immediately or show red errors, please let me know.
echo.
pause
