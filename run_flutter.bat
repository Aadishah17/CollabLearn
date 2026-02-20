@echo off
set FLUTTER_PATH=D:\Enjoy-Movie-main\flutter\bin\flutter.bat
cd flutter_app

echo 🔍 Checking Flutter environment...
call %FLUTTER_PATH% doctor

echo 📱 Checking connected devices...
call %FLUTTER_PATH% devices

echo 🚀 Ensuring project is ready for Android...
if not exist "android" (
  echo No android folder found. Initializing...
  call %FLUTTER_PATH% create . --platforms android
)

echo ⚡ Launching CollabLearn Flutter App...
call %FLUTTER_PATH% run
pause
