@echo off
echo STARTING_DEBUG > debug_log.txt
echo ========================================== >> debug_log.txt
echo NPM INSTALL >> debug_log.txt
call npm install >> debug_log.txt 2>&1
echo ========================================== >> debug_log.txt
echo NPM RUN DEV >> debug_log.txt
call npm run dev >> debug_log.txt 2>&1
