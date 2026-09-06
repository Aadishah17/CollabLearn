# CollabLearn Mobile Platform Strategy & Support Tiers

This document formalizes the support tiers, build guidelines, and architectural boundaries for the mobile clients across the CollabLearn repository.

---

## Support Tier Matrix

| Platform / Directory         | Language / Framework    | Support Tier                      | Status            | CI / Build Verification                            |
| :--------------------------- | :---------------------- | :-------------------------------- | :---------------- | :------------------------------------------------- |
| **Android (`android/`)**     | **Kotlin / Material 3** | **Tier 1 (Production-Supported)** | Active            | Verified via `gradlew assembleDebug` & Android CLI |
| **iOS (`ios/`)**             | **Swift / UIKit**       | **Tier 2 (Experimental)**         | Community Preview | Xcode project maintained for native iOS testing    |
| **Flutter (`flutter_app/`)** | **Dart / Flutter**      | **Tier 3 (Archived)**             | Deprecated        | Archived legacy prototype; not built in CI         |

---

## Platform Details

### 1. Android Companion Application (`android/`) — Tier 1 (Production)

The Kotlin Android application is the primary, production-supported mobile client for CollabLearn.

- **Architecture**: MVVM with Material 3, ViewBinding, and Retrofit2 REST client.
- **Minimum SDK**: API 24 (Android 7.0 Nougat)
- **Target SDK**: API 34 (Android 14)
- **Key Capabilities**:
  - 1-Click Demo Login credentials for Admin (`admin@collablearn.com`), Student (`student@collablearn.com`), and Mentor (`mentor@collablearn.com`).
  - Dynamic Server IP configuration modal with instant toggle between Android Emulator (`10.0.2.2:5001`), Localhost, and custom LAN IP (`192.168.x.x`).
  - Integrated `WebPortalActivity` featuring hardware-accelerated Chrome WebView with persistent session cookie injection.
  - Native Dashboard with live metrics, quick links, and status badges.
- **Build Verification**:
  ```bash
  cd android
  gradlew.bat assembleDebug
  ```

### 2. iOS Application (`ios/`) — Tier 2 (Experimental)

The Swift iOS application provides native iOS primitives and testing grounds for mobile parity.

- **Status**: Maintained as an experimental companion.
- **Contract**: Conforms to the shared OpenAPI specification defined in [docs/api/openapi.yaml](../api/openapi.yaml).

### 3. Flutter Client (`flutter_app/`) — Tier 3 (Archived)

The Flutter prototype served as an early cross-platform experiment.

- **Status**: **Archived / Deprecated**.
- **Action**: Flutter build artifacts (`build/`, `.dart_tool/`) are untracked in `.gitignore`. No new active feature development occurs in `flutter_app/`. All mobile efforts are unified into the Tier 1 Kotlin Android app.

---

## Unified API Contract Alignment

All mobile clients consume endpoints defined in the shared contract:

- API Specification: [docs/api/openapi.yaml](../api/openapi.yaml)
- Shared Validation Schemas: [shared/schemas/index.js](../../shared/schemas/index.js)
