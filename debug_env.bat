@echo off
echo START DEBUG > debug_log.txt
echo Checking Node... >> debug_log.txt
"C:\Program Files\nodejs\node.exe" -v >> debug_log.txt 2>&1
echo Checking NPM... >> debug_log.txt
call "C:\Program Files\nodejs\npm.cmd" -v >> debug_log.txt 2>&1
echo END DEBUG >> debug_log.txt
