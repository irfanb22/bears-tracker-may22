# Bears Prediction Tracker - Project Context

Last updated: 2026-02-22
Repository path: `/Users/irfan/Projects/bears-tracker-may22-main`

## 1. What This Site Is

This app is a Chicago Bears fan prediction platform.

Core idea:
- Fans make predictions about the Bears season (player stats, team outcomes, draft items).
- Users attach a confidence level to each prediction.
- Community sentiment is shown as aggregate percentages.
- Users track their own picks and points in a personal dashboard.
- Admin can manage questions and season content.

Positioning:
- Not a gambling product.
- A fan knowledge and bragging-rights tracker.

Product origin story:
- Started from a recurring personal problem: you and your brother make Bears predictions, then later forget who said what.
- UX inspiration includes the simplicity of Polymarket-style yes/no markets.
- Initial implementation was built with Bolt.

Current primary business goal:
- Score all existing 2025-season user predictions in the database.

## 2. Current Feature Summary

### Public
- Home page with 2025 season prediction questions.
- Category filters:
  - `all`
  - `player_stats`
  - `team_stats`
  - `draft_predictions`
- Community percentages shown per question.
- "How It Works" page explaining product intent.

### Auth
- Email/password sign up and login.
- Email verification callback flow.
- Forgot password + reset password flow.

### Logged-In User
- Create/update prediction per question (upsert behavior).
- Select confidence: `low`, `medium`, `high`.
- Deadline enforcement for predictions.
- Dashboard with:
  - total predictions
  - active/upcoming predictions
  - season score/points
  - latest prediction cards

### Admin
- Admin-protected route/dashboard.
- Create new questions.
- Edit question details:
  - text
  - category
  - type (`yes_no` or `multiple_choice`)
  - deadline
  - featured flag
  - status (`pending`, `live`, `completed`)
  - correct answer
- Manage multiple-choice options.

## 3. Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- `react-router-dom`
- `date-fns`
- `react-day-picker`
- `lucide-react`

### Backend / Data
- Supabase
  - Auth
  - Postgres
  - Realtime subscriptions
  - RLS policies and migrations

## 4. Important App Architecture Notes

- App entry:
  - `src/main.tsx`
  - `src/App.tsx`
- Global providers:
  - `AuthProvider` in `src/lib/auth.tsx`
  - `PredictionProvider` in `src/lib/PredictionContext.tsx`
- Main app pages/components:
  - `src/components/PredictionInterface.tsx`
  - `src/components/Dashboard.tsx`
  - `src/components/AdminDashboard.tsx`
  - `src/components/HowItWorks.tsx`
- Supabase client:
  - `src/lib/supabase.ts`

## 5. Data/Domain Model (High-Level)

Primary entities currently used:
- `questions`
- `predictions`
- `choices`
- `prediction_types`
- `games` (present in migrations/legacy components)

Prediction behavior:
- User has one current prediction per question (`upsert` on `user_id, question_id`).
- Aggregates are computed from all predictions for community percentages.

## 6. Environment and Credentials (Safe Handling)

Use local env files and never commit secrets.

### Client-exposed variables (okay for browser bundle)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Secret variables (server-only; never in `VITE_*`)
- Supabase service role key
- SMTP provider credentials
- Domain/DNS provider API keys
- Transactional email API keys

Recommended local files:
- `.env.local` for local dev values
- Keep ignored via `.gitignore`

## 7. Hosting / Domain / Email Provider

Known:
- Domain: `bearsprediction.com`
- Domain registrar/owner platform: Squarespace
- App hosting provider: Netlify
- Email provider: Brevo (via Supabase custom SMTP for auth emails)
- Netlify-style redirect file exists: `public/_redirects`

To fill in:
- DNS host (if separate from Squarespace):
- Primary support/admin email:

## 8. Supabase Project Notes

Confirmed from dashboard screenshots:
- Supabase project name: `bears-prediction-market`
- Environment label visible in Supabase UI: `PRODUCTION`
- Auth mode in use: Supabase Auth (email/password)
- User signups: enabled
- Confirm email: enabled
- Manual account linking: disabled
- Anonymous sign-ins: disabled
- Custom SMTP: enabled
  - Sender email: `noreply@bearsprediction.com`
  - Sender name: `Bears Prediction`
  - SMTP host: `smtp-relay.brevo.com`
  - Port: `587`
  - Minimum interval per user: `60 seconds`

Still to confirm:
- RLS strategy summary (can be derived from migrations and policies)

Confirmed from additional screenshots:
- Supabase project ID/reference: `mvyvfvwguwqowytnkvvs`
- Supabase project URL: `https://mvyvfvwguwqowytnkvvs.supabase.co`
- Current setup appears to be a single Supabase project with one active branch (`main`) marked `PRODUCTION`.
- No separate staging project currently in use.
- Auth URL configuration:
  - Site URL: `https://bearsprediction.com/`
  - Redirect URLs allowlist:
    - `http://localhost:5173/auth/callback`
    - `https://bears-predictions.netlify.app/auth/callback`
    - `https://bearsprediction.com/auth/callback`

## 9. Development Workflow Notes

- This project was initially built with Bolt.
- Ongoing development now in Codex.
- Current working style is vibe coding / iterative no-heavy-process development.
- Keep this file updated after major feature, infra, or auth changes.

## 11. Git / GitHub Setup Status

Local machine status (as of 2026-02-22):
- Git identity is configured globally:
  - `user.name=irfanb22`
  - `user.email=77904897+irfanb22@users.noreply.github.com`
- Repository initialized locally with `git init` at:
  - `/Users/irfan/Projects/bears-tracker-may22-main`
- SSH key created for GitHub auth:
  - Private key: `~/.ssh/id_ed25519_github`
  - Public key: `~/.ssh/id_ed25519_github.pub`
- SSH config updated to use that key for `github.com`.
- SSH authentication verified successfully against GitHub.
- Remote configured:
  - `origin = git@github.com:irfanb22/bears-tracker-may22.git`
- Local-vs-remote file comparison completed:
  - All shared files are identical to `origin/main`.
  - Local-only file: `PROJECT_CONTEXT.md`.

Pending repo wiring:
- Push initial commit from this local git repo only when approved.

## 10. Open Questions / Backlog Notes

- Confirm canonical route behavior for unauthenticated redirects (`/login` route does not appear in `App.tsx`).
- Decide if admin auth check should move from hardcoded email to role/claim-based authorization.
- Clarify whether legacy components (`PredictionsPage`, `GameCard`) are still active or archival.
- Define and implement final scoring rules for 2025 predictions (points logic and when scoring is run).

---

## Change Log

### 2026-02-22
- Created initial project context document with current app understanding.
- Added Git/GitHub setup status and remaining steps.
- Added product origin story, domain/hosting/email provider details, and primary scoring goal.
- Updated GitHub setup status to reflect successful SSH auth, remote setup, and local/remote parity check.
- Added confirmed Supabase authentication and Brevo SMTP configuration from dashboard screenshots.
