# CollabLearn Android (Kotlin)

This Android app is native Kotlin (`.kt`) with XML layouts.

## Stack
- Language: Kotlin
- Build: Gradle + Android Plugin
- Networking: Retrofit + Gson

## Included screens
- `MainActivity` (landing)
- `LoginActivity` (login)
- `AiLearningActivity` (AI roadmap + study session + top YouTube guidance link)

## API base URL
Configured through Gradle property `API_BASE_URL` and exposed via `BuildConfig.API_BASE_URL`.

Default:
- `http://10.0.2.2:5001/` (Android emulator -> host machine backend)

Override example:
```powershell
cd android
.\gradlew.bat assembleDebug -PAPI_BASE_URL=http://192.168.1.20:5001/
```

## Build (Windows)
```powershell
cd android
.\run_android_build.bat
```

APK output:
- `android/app/build/outputs/apk/debug/app-debug.apk`
