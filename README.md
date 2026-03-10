# CollabLearn

CollabLearn is a skill-learning platform centered on the web experience. The active product surface is the React website, backed by an Express and MongoDB API for roadmaps, mentor workflows, community features, and admin tooling.

## Project Architecture

The repository contains:

- **`client/`**: React-based web frontend.
- **`server/`**: Node.js & Express backend API.
- **`flutter_app/`**: Secondary mobile codebase that is not the current product priority.

## Core Experience

- **AI Learning Roadmaps**: Personalized generation based on skill, level, and timeline.
- **Progress Tracking**: Persistent learning plans to monitor your growth.
- **AI Mentor Chat**: Built-in guidance for next-step recommendations and study-session planning.
- **Skill Marketplace**: Platform for users to teach and learn from each other.
- **Session Booking**: 1v1 booking system with calendar management.
- **Community Engagement**: Posting, commenting, and real-time messaging with Socket.IO.
- **Admin Console**: Protected moderation, analytics, user management, and settings.

## Tech Stack

### Web & Backend

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Real-time**: Socket.IO
- **Planning Engine**: Local roadmap and study-session engine with optional external resource enrichment

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

   Set your `JWT_SECRET` and `MONGODB_URI` in `server/.env`.
   `SUPER_ADMIN_EMAILS` is optional; the default super-admin allow list already includes `shahaadi285@gmail.com`.

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
| `run_flutter.bat` | Helper for the secondary Flutter codebase. |

## AI Integration

The website currently uses the local learning engine exposed by the API. To verify engine status:

```bash
curl http://localhost:5001/api/ai/studio-status
```

The status route returns the active provider and model metadata used by the web roadmap flow.

## Module APIs

- `GET /api/modules`: List available learning modules.
- `POST /api/modules`: Create a new module (Auth required).
- `GET /api/modules/:id`: View module details.
- `PUT /api/modules/:id`: Update module (Auth required).
- `DELETE /api/modules/:id`: Remove module (Auth required).

## AI API Endpoints

- `POST /api/ai/chat`: Interactive mentor chat.
- `POST /api/ai/roadmap`: Generate personalized learning paths.
- `POST /api/ai/study-session`: Generate a focused next study session from the active plan.
- `GET /api/ai/plans`: Retrieve saved learning plans.
- `PATCH /api/ai/plans/:planId/progress`: Update learning progress.

## Admin Access

- Admin website routes are protected server-side as well as in the client router.
- The server supports a super-admin email allow list.
- By default, `shahaadi285@gmail.com` is treated as a protected super-admin account.
