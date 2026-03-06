# CollabLearn

CollabLearn is a full-stack skill-learning platform where users can learn any skill with AI guidance, personalized roadmaps, curated resources, mentor sessions, and community support.

## Project Architecture

The project is divided into three main components:

- **`client/`**: React-based web frontend.
- **`server/`**: Node.js & Express backend API.
- **`flutter_app/`**: Cross-platform mobile application built with Flutter.

## Core Experience

- **AI Learning Roadmaps**: Personalized generation based on skill, level, and timeline.
- **Progress Tracking**: Persistent learning plans to monitor your growth.
- **AI Mentor Chat**: Real-time study guidance and next-step recommendations via Gemini AI.
- **Skill Marketplace**: Platform for users to teach and learn from each other.
- **Session Booking**: 1v1 booking system with calendar management.
- **Community Engagement**: Posting, commenting, and real-time messaging with Socket.IO.
- **Rating & Feedback**: Continuous improvement through peer reviews.

## Tech Stack

### Web & Backend

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Real-time**: Socket.IO
- **AI**: Google Generative AI (Gemini 2.5 Flash)

### Mobile

- **Framework**: Flutter / Dart
- **State Management**: Provider
- **Local Storage**: Shared Preferences
- **Networking**: Http

## Quick Start (Web)

1. **Environment Setup**:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Set your `GEMINI_API_KEY` and `MONGODB_URI` in `server/.env`.

2. **Install Dependencies**:

   ```bash
   npm run setup
   ```

3. **Run Application**:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5001`

## Mobile App Setup (Flutter)

1. Ensure Flutter SDK is installed.
2. Navigate to `flutter_app/`:

   ```bash
   cd flutter_app
   flutter pub get
   flutter run
   ```

## Utility Scripts

The project includes several root-level scripts for development and maintenance:

| Script | Description |
|--------|-------------|
| `start.bat` | Main entry point to run the entire stack. |
| `run_everything.bat` | Quickly starts all services. |
| `install_dependencies.bat` | Installs all required packages across all directories. |
| `clean.js` | Utility to clean up temporary files and caches. |
| `fix_deps.bat` | Resolves common dependency issues. |
| `debug_*.bat` | Various scripts for debugging client, server, and environment. |
| `run_flutter.bat` | Helper to launch the Flutter application. |

## AI Integration

Google AI Studio integration is pre-configured. To verify:

```bash
curl http://localhost:5001/api/ai/studio-status
```

For more details, see the [AI Endpoints](#ai-api-endpoints) section.

## Module APIs

- `GET /api/modules`: List available learning modules.
- `POST /api/modules`: Create a new module (Auth required).
- `GET /api/modules/:id`: View module details.
- `PUT /api/modules/:id`: Update module (Auth required).
- `DELETE /api/modules/:id`: Remove module (Auth required).

## AI API Endpoints

- `POST /api/ai/chat`: Interactive mentor chat.
- `POST /api/ai/roadmap`: Generate personalized learning paths.
- `GET /api/ai/plans`: Retrieve saved learning plans.
- `PATCH /api/ai/plans/:planId/progress`: Update learning progress.
