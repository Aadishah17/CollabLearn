# CollabLearn iOS App

This directory contains the Swift source code for the native iOS version of CollabLearn.

## How to Run
Since you are currently on Windows, you cannot compile or run this directly. To run this app:

1.  Transfer this `ios` folder to a Mac.
2.  Open Xcode.
3.  Create a new SwiftUI Project named "CollabLearnApp".
4.  Replace the default files (`ContentView.swift`, `CollabLearnAppApp.swift`) with the files in this directory.
5.  Copy `LoginView.swift` and `Shared/Theme.swift` into your Xcode project.
6.  Build and Run (Cmd + R) on the iOS Simulator or a Device.

## Structure
-   `CollabLearnAppApp.swift`: Main entry point.
-   `ContentView.swift`: The Landing Page implementation.
-   `LoginView.swift`: The Login Screen implementation.
-   `Shared/Theme.swift`: Custom colors and design tokens to match the web app.
