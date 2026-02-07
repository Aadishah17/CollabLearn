# CollabLearn iOS (Swift)

This iOS app is native Swift/SwiftUI (`.swift`) and includes AI learning integration.

## Stack
- Language: Swift
- UI: SwiftUI
- Networking: URLSession

## Included screens
- `ContentView` (landing)
- `LoginView` (backend login call)
- `AiLearningView` (AI roadmap + study session + top video guidance link)

## API configuration
- Base URL is in `Services/APIConfig.swift`.
- Default: `http://127.0.0.1:5001` (works for iOS Simulator with backend running on the same Mac).
- For physical iPhone, replace with your Mac LAN IP (example: `http://192.168.1.20:5001`).

## Required Info.plist setting for local HTTP (dev)
Add:
- `App Transport Security Settings` -> `Allow Arbitrary Loads` = `YES`

or configure an ATS exception for your API host.

## Run
1. Open folder on macOS in Xcode.
2. Create/open SwiftUI app target and include all `.swift` files from `ios/CollabLearnApp/`.
3. Apply the Info.plist ATS setting above.
4. Build and run on Simulator or device.
