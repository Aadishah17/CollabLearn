# Website Feature Test Report

## Scope
- Website-only QA validation for the React web client.
- Flutter/mobile application was intentionally excluded.
- Testing was performed in logged-out mode to validate public website pages and route guards.

## Environment
- Frontend URL: `http://localhost:5173`
- Browser automation: Playwright (browser container)
- Backend/API: not started for this pass

## Features Verified

### Public website routes
- Landing page loads and displays CollabLearn branding.
- Landing page exposes navigation to login and signup.
- Public `/teach` route is reachable without authentication.
- Unknown routes render Not Found UI.

### Authentication pages
- Login page renders with required email/password inputs.
- Signup page renders all required fields (name, email, password, confirm password, terms checkbox).
- Client-side HTML validation blocks empty submissions for login and signup.
- Email-format validation is enforced on login.

### Protected website routes (access control)
Verified all tested protected routes redirect unauthenticated users to `/login`:
- `/dashboard`
- `/modules`
- `/modules/create`
- `/browse-skills`
- `/skill-recommendations`
- `/calendar`
- `/community`
- `/messages`
- `/achievements`
- `/profile`
- `/book-session`
- `/settings`
- `/skill-sessions`
- `/video-call`
- `/ai-learning`
- `/admin`
- `/admin/manage-users`
- `/admin/manage-posts`
- `/admin/analytics`
- `/admin/settings`
- `/get-premium`
- `/payment`
- `/courses`

## Issues / Follow-up
- A specific custom password mismatch message was not observed on signup in this logged-out website-only pass; mismatch handling may be deferred to submit/API response path.
- Full end-to-end verification of logged-in experiences (dashboard modules, community posting, booking, messaging, admin operations, AI learning, payments, courses) requires a running backend database and valid test accounts.
