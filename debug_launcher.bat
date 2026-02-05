@echo off
echo STARTING DEBUG > debug_launcher_log.txt
echo Checking Node version... >> debug_launcher_log.txt
node -v >> debug_launcher_log.txt 2>&1
echo. >> debug_launcher_log.txt
echo Checking NPM version... >> debug_launcher_log.txt
call npm -v >> debug_launcher_log.txt 2>&1
echo. >> debug_launcher_log.txt
echo DIR content: >> debug_launcher_log.txt
dir >> debug_launcher_log.txt 2>&1
echo DONE >> debug_launcher_log.txt
EXIT /B 0
