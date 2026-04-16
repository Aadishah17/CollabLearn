# CollabLearn

CollabLearn is a skill-learning platform centered on the web experience. The active product surface is the React website, backed by an Express and MongoDB API for roadmaps, mentor workflows, community features, and admin tooling.

## Live Website

- Production: [https://client-dun-ten-53.vercel.app/](https://client-dun-ten-53.vercel.app/)

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
   The local default is `mongodb://127.0.0.1:27017/collablearn`, which matches the Windows MongoDB service install better than `localhost`.

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
| `server/scripts/seed-mock-data.js` | Seeds deterministic demo data into the active MongoDB database. |

## CI / Quality

Pull requests and pushes to `main` run the GitHub Actions workflow in `./.github/workflows/ci.yml`. It installs the root, server, and client dependencies, then runs `npm test --prefix server`, `npm test --prefix client`, and `npm run build --prefix client`.

Keep local changes aligned with that same bar before opening a PR:

- `npm test --prefix server`
- `npm test --prefix client`
- `npm run build --prefix client`
- `npm run lint --prefix client`
- `npm run db:ping --prefix server`
- `npm run seed:mock --prefix server`

## Production Notes

- Set a strong `JWT_SECRET` in `server/.env`. The server now refuses placeholder secrets.
- Browser auth now supports an `httpOnly` session cookie alongside bearer-token compatibility. Tune cookie behavior with `AUTH_COOKIE_*` variables in `server/.env`.
- Keep `CORS_ORIGINS` restricted to trusted frontend hosts in production.
- Set `TRUST_PROXY=1` when the API is deployed behind a reverse proxy or platform load balancer.
- Optionally set `REDIS_URL` to share rate-limit counters across multiple API instances. If Redis is unavailable, the server falls back to local in-memory counters instead of failing requests.
- Use `DB_CONNECT_MAX_ATTEMPTS`, `DB_CONNECT_RETRY_BASE_MS`, and `DB_CONNECT_RETRY_MAX_MS` if you need to tune MongoDB retry behavior for slower environments.
- MongoDB connection failures no longer terminate the process immediately. The API stays up, retries in the background, and exposes the current readiness state through `/api/health`.
- Runtime uploads are served from `server/uploads/` and should stay out of version control.
- The AI model is configurable through `GEMINI_MODEL`; if omitted, the server falls back to `gemini-2.0-flash`.

## Render Deployment

The repo now includes a root-level [render.yaml](./render.yaml) blueprint for a two-service Render setup:

- `collablearn-web`: static frontend built from `client/`
- `collablearn-api`: Node/Express API built from `server/`

Before applying the blueprint, set these secret values in Render:

- `MONGODB_URI`
- `JWT_SECRET`
- `NVIDIA_API_KEY`
- `GEMINI_API_KEY` if you want Gemini enabled
- `VITE_GOOGLE_CLIENT_ID` if you want Google auth enabled in the frontend

The blueprint wires the frontend to the API automatically through Render service references. `VITE_API_URL` and `CORS_ORIGINS` can now consume bare Render hostnames and normalize them to HTTPS at runtime.

## Mock Data

The server includes a deterministic seed script for local development and CI smoke runs:

```bash
npm run seed:mock --prefix server
```

Use `npm run seed:mock:reset --prefix server` to rebuild the demo dataset from scratch on a non-production database. The seeded credentials are printed by the script after it finishes.

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
