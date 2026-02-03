@echo off
echo STARTING_DEBUG > debug_log_2.txt
echo ========================================== >> debug_log_2.txt
echo NPM INSTALL (LEGACY PEER DEPS) >> debug_log_2.txt
call npm install --legacy-peer-deps >> debug_log_2.txt 2>&1
echo ========================================== >> debug_log_2.txt
echo NPM RUN DEV >> debug_log_2.txt
call npm run dev >> debug_log_2.txt 2>&1
