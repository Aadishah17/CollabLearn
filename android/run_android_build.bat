@echo off
echo Starting Android Build... > android_build_log.txt
echo Checking for devices... >> android_build_log.txt
call adb devices >> android_build_log.txt 2>&1
echo. >> android_build_log.txt
echo Building APK... >> android_build_log.txt
set API_BASE_URL=http://10.0.2.2:5001/
call gradlew.bat assembleDebug -PAPI_BASE_URL=%API_BASE_URL% --no-daemon --project-cache-dir "C:\Users\sseja\AppData\Local\Temp\CollabLearnGradleCache" >> android_build_log.txt 2>&1
echo Build Finished. >> android_build_log.txt
