@echo off
echo Starting Android Build... > android_build_log.txt
echo Checking for devices... >> android_build_log.txt
call adb devices >> android_build_log.txt 2>&1
echo. >> android_build_log.txt
echo Building APK... >> android_build_log.txt
call gradlew.bat assembleDebug --no-daemon --project-cache-dir "C:\Users\sseja\AppData\Local\Temp\CollabLearnGradleCache" >> android_build_log.txt 2>&1
echo Build Finished. >> android_build_log.txt
