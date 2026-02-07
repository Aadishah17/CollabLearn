# CollabLearn

CollabLearn is a full-stack skill-learning platform where users can learn any skill with AI guidance, personalized roadmaps, curated resources, mentor sessions, and community support.

## Core Experience

- AI learning roadmap generation based on skill, level, weekly hours, and timeline
- Persistent learning plans with progress tracking
- AI mentor chat for study guidance and next-step recommendations
- Skill marketplace for teaching and learning
- Session booking and calendar management
- Community posting, comments, and engagement
- Real-time messaging with Socket.IO

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + MongoDB + Mongoose
- Realtime: Socket.IO
- AI: Google Generative AI (Gemini) with robust fallback planning

## Quick Start

1. Create env files from templates:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

2. Configure backend environment in `server/.env`:

```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/collablearn
JWT_SECRET=replace-with-secure-secret
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

3. (Optional) Configure frontend API behavior in `client/.env`:

```bash
VITE_API_URL=
VITE_DEV_PORT=5173
VITE_API_PROXY_TARGET=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=
```

4. Install dependencies:

```bash
npm run setup
```

5. Start both frontend and backend:

```bash
npm run dev
```

6. Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

## Module APIs

- `GET /api/modules` (public + owned/collaborator modules when authenticated)
- `POST /api/modules` (auth required)
- `GET /api/modules/:id` (public/private access logic)
- `PUT /api/modules/:id` (auth required)
- `DELETE /api/modules/:id` (auth required)

## AI API Endpoints

- `GET /api/ai/studio-status`
- `POST /api/ai/studio-test`
- `POST /api/ai/chat`
- `POST /api/ai/roadmap`
- `GET /api/ai/plans` (auth required)
- `GET /api/ai/plans/:planId` (auth required)
- `PATCH /api/ai/plans/:planId/progress` (auth required)

## Google AI Studio Integration

1. Create an API key in Google AI Studio:
   - `https://aistudio.google.com/app/apikey`

2. Configure backend env (`server/.env`):

```bash
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-2.5-flash
# Optional:
# GEMINI_MODEL_CANDIDATES=gemini-1.5-flash,gemini-1.5-pro,gemini-pro
# GEMINI_TEMPERATURE=0.7
# GEMINI_TOP_P=0.95
# GEMINI_TOP_K=40
# GEMINI_MAX_OUTPUT_TOKENS=2048
# GEMINI_SYSTEM_INSTRUCTION=You are a concise learning mentor.
```

3. Verify integration:

```bash
curl http://localhost:5001/api/ai/studio-status
curl -X POST http://localhost:5001/api/ai/studio-test -H "Content-Type: application/json" -d "{}"
```

If `studio-test` succeeds, chat and roadmap endpoints will use Google AI Studio automatically.
