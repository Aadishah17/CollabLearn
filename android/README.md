# CollabLearn Android App

This directory contains the code for the native Android application.

## How to Run

1.  **Open in Android Studio**:
    -   Launch Android Studio.
    -   Select "Open an existing project".
    -   Navigate to and select the `android` directory inside `CollabLearn-main/CollabLearn-main/android`.

2.  **Sync Gradle**:
    -   Android Studio will attempt to sync the project. Ensure you have the Android SDK installed.
    -   *Note*: Since this is a scaffolded project, you may need to generate a root `build.gradle` and `settings.gradle` if you are importing it as a fresh project, or Android Studio can usually generate the wrapper for you.

3.  **Run**:
    -   Connect a physical Android device or start an Emulator.
    -   Click the **Run** button (Green unique triangle) in the toolbar.

## Structure
-   `app/src/main/java/com/collablearn/app/`: Kotlin source files (`MainActivity.kt`, `LoginActivity.kt`).
-   `app/src/main/res/layout/`: XML UI Layouts.
-   `app/src/main/AndroidManifest.xml`: App configuration.
