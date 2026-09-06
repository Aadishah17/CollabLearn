# CollabLearn

CollabLearn is a skill-learning platform centered on the web experience. The active product surface is the React website, backed by an Express and MongoDB API for roadmaps, mentor workflows, community features, and admin tooling.

## Live Website

- Production: [https://client-dun-ten-53.vercel.app/](https://client-dun-ten-53.vercel.app/)

## Project Architecture

The repository contains:

- **`client/`**: React 19 web frontend with Cyber-Luminescent UI/UX and Tailwind CSS.
- **`server/`**: Node.js & Express API with unified auth, AI pipeline orchestration, and pluggable storage.
- **`android/`**: Native Kotlin Android companion app (**Tier 1: Production-Supported**).
- **`ios/`**: Native Swift companion app (**Tier 2: Experimental**).
- **`flutter_app/`**: Legacy Flutter prototype (**Tier 3: Archived**).
- **`docs/api/openapi.yaml`**: Shared OpenAPI 3.1 contract preventing client/web drift.

See [`docs/mobile/MOBILE_SUPPORT.md`](./docs/mobile/MOBILE_SUPPORT.md) for platform support tiers.

## Core Experience

- **AI Learning Roadmaps**: Personalized multi-week curriculum generated via an isolated AI orchestration pipeline.
- **Progress Tracking**: Persistent learning plans to monitor milestone growth.
- **AI Mentor Chat**: Interactive guidance with multi-provider fallback.
- **Skill Marketplace**: Platform for users to teach and learn from each other.
- **Session Booking**: 1v1 booking system with calendar management.
- **Community Engagement**: Posting, commenting, and real-time messaging with Socket.IO.
- **Admin Console**: Protected moderation, analytics, user management, and telemetry.

## Tech Stack

### Web & Backend

- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **Backend**: Node.js (>=20.0.0) + Express + MongoDB + Mongoose 8
- **Authentication**: Unified HTTP-only cookies + Bearer token fallback + Role authorization
- **Storage**: Pluggable adapter (Local Disk, AWS S3 / S3-compatible, Cloudinary)
- **Observability**: Structured JSON logging, `X-Request-Id` tracing, and route latency tracking
- **Real-time**: Socket.IO

### Mobile Companions

- **Primary (Tier 1)**: Android Kotlin (API 24-34, Material 3, ViewBinding, Retrofit)
- **Experimental (Tier 2)**: iOS Swift (UIKit / URLSession)
- **Archived (Tier 3)**: Flutter (Preserved for historical reference)

## Local Setup

1. Copy env templates:

   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

2. Install dependencies:

   ```bash
   npm run setup
   ```

3. Start both apps:

   ```bash
   npm run dev
   ```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

## Commands

Run these from the repository root:

- `npm run dev` - run client and server in development mode.
- `npm run build` - build the client app.
- `npm run test` - run server and client tests.
- `npm run lint` / `npm run lint:fix` - run ESLint checks and autofix where possible.
- `npm run format` / `npm run format:check` - apply or verify Prettier formatting.
- `npm run audit` - audit production dependencies without dev packages.

## Environment Variables

- Root `.env.example` is a quick reference for commonly used variables.
- Use `server/.env.example` and `client/.env.example` as canonical templates for each app.
- Required server variables include `MONGODB_URI` and `JWT_SECRET`.
- Client variables use the `VITE_` prefix (for example, `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`).

## Utility Scripts

The project includes several root-level scripts for development and maintenance:

| Script                             | Description                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| `start.bat`                        | Main entry point to run the entire stack.                       |
| `run_everything.bat`               | Quickly starts all services.                                    |
| `install_dependencies.bat`         | Installs all required packages across all directories.          |
| `clean.js`                         | Utility to clean up temporary files and caches.                 |
| `fix_deps.bat`                     | Resolves common dependency issues.                              |
| `debug_*.bat`                      | Various scripts for debugging client, server, and environment.  |
| `run_flutter.bat`                  | Helper for the secondary Flutter codebase.                      |
| `server/scripts/seed-mock-data.js` | Seeds deterministic demo data into the active MongoDB database. |

## CI / Quality

Pull requests to `main` run `./.github/workflows/ci.yml`, which installs dependencies and runs lint/test/build scripts when present.

Before opening a PR, run at least:

- `npm run lint`
- `npm run test`
- `npm run build`

All three commands should complete successfully before you open or update a pull request.

## Production Notes

- Set a strong `JWT_SECRET` in `server/.env`. The server now refuses placeholder secrets.
- Browser auth now supports an `httpOnly` session cookie alongside bearer-token compatibility. Tune cookie behavior with `AUTH_COOKIE_*` variables in `server/.env`.
- Keep `CORS_ORIGINS` restricted to trusted frontend hosts in production.
- Set `TRUST_PROXY=1` when the API is deployed behind a reverse proxy or platform load balancer.
- Optionally set `REDIS_URL` to share rate-limit counters across multiple API instances. If Redis is unavailable, the server falls back to local in-memory counters instead of failing requests.
- Use `DB_CONNECT_MAX_ATTEMPTS`, `DB_CONNECT_RETRY_BASE_MS`, and `DB_CONNECT_RETRY_MAX_MS` if you need to tune MongoDB retry behavior for slower environments.
- Production storage supports pluggable providers: local filesystem fallback (`server/uploads/` or `/tmp` in serverless), AWS S3/S3-compatible (`AWS_S3_BUCKET`), or Cloudinary (`CLOUDINARY_URL`). MongoDB persists only URLs and object metadata.
- Request tracing and observability automatically attach an `X-Request-Id` to all responses with structured JSON logging and latency metrics.
- For planned major version bumps (Mongoose 9, Vite 8, etc.), consult the isolated roadmap in [`docs/upgrades/major-dependency-upgrades.md`](./docs/upgrades/major-dependency-upgrades.md).
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

## Vercel Deployment

The repository now includes a root-level [`vercel.json`](./vercel.json) for monorepo frontend deployments.

- Build/install are pinned to the frontend package:
  - `installCommand`: `npm install --prefix client`
  - `buildCommand`: `npm run build --prefix client`
  - `outputDirectory`: `client/dist`
- SPA and API/upload rewrites are included so `/api/*` and `/uploads/*` resolve to the deployed API domain.

Recommended setup:

1. Deploy the frontend from the repository root in Vercel (no custom root directory needed).
2. Set `VITE_GOOGLE_CLIENT_ID` in the frontend project if Google sign-in is enabled.
3. Deploy the API as a separate Vercel project using `server/` (it already includes `server/vercel.json`).
4. Set `CORS_ORIGINS` in the API project to include the frontend domain.

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
