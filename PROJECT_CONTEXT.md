# Bears Prediction Tracker - Project Context

Last updated: 2026-02-25
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

## 2.1 Quick Memory Guide (Plain English)

### What the app does
- This is a Bears fan prediction app.
- People sign up, make picks, and see how they compare to other fans.
- It is for fun and bragging rights, not gambling.

### Main user flow
1. User signs up (email + password).
2. User confirms email from inbox.
3. User logs in and sees live questions.
4. User picks an answer (`yes/no` or multiple choice) and sets confidence.
5. User can update their prediction while the question is still live.
6. User sees their picks and results in Dashboard.
7. User checks community standings in Leaderboard.

### Admin flow
1. Admin logs in.
2. Admin opens Admin Dashboard.
3. Admin creates/edits questions (text, type, category, deadline, status, featured, correct answer).
4. Questions set to `live` become available for users to predict.
5. Questions set to `completed` + correct answer drive scoring and leaderboard updates.

### Core product rules (current)
- One current prediction per user per question (latest saved value wins).
- Predictions can only be created/updated before deadline.
- Confidence is shown, but does not change points right now.
- Scoring policy: `1` point correct, `0` incorrect/unresolved.
- Accuracy only counts resolved questions.
- Leaderboard is for authenticated users and uses masked display names.

### Access and security rules (current)
- Public can browse core prediction content.
- Authenticated users can write their own predictions only.
- Admin actions are role-based in the database (`user_roles`), not just email checks in UI.
- Secrets must stay out of client env (`VITE_*` only for public browser-safe keys).

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

## 5.1 Official Scoring Policy (Current)

Scope:
- Current scoring scope is the `2025` Bears season.
- Future seasons (for example `2026`) should use the same framework but be scored separately by season.

Core scoring rules:
- `1 point` for each correct prediction.
- `0 points` for each incorrect prediction.
- Confidence (`low`, `medium`, `high`) does **not** affect points.

Resolution rules:
- A prediction is considered `resolved` when its related question has a final `correct_answer` (and/or is marked completed).
- Unresolved predictions are excluded from accuracy until resolved.

Accuracy formula:
- `accuracy = correct_predictions / resolved_predictions`
- Pending/unresolved predictions should be shown separately and should not reduce accuracy.

Confidence product intent:
- Confidence is a fan-sentiment signal, not a scoring multiplier.
- Use confidence to understand community conviction on a topic (for example, how strongly fans feel about a yes/no outcome).

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
- UI inconsistency (auth modal): "Check Your Email" success modal shows duplicate close icons on the right side.
- UI inconsistency (modal layering): registration/login modal state can reveal underlying "Don't have an account? Sign up" strip behind the success modal, creating stacked/overlapping surfaces.
- UI inconsistency (navbar desktop): nav items and icons are misaligned when a long email is present; "Log Out" wraps to two lines and spacing looks uneven.
- UI bug (admin date picker): in Admin > Create New Question, deadline date picker month navigation appears stuck on February 2026 (next/prev controls do not move month as expected).
- Product-state note: with 2025 wrapped and no 2026 questions seeded yet, new users can authenticate and navigate but cannot submit predictions (expected behavior for now).
- UX note: Dashboard "Make Your First Prediction" CTA currently routes back to home; this is acceptable in current state because active prediction questions are not yet available.

## 12. Upcoming Roadmap (Phased)

### Phase 1: 2025 Season Closeout + User Communication
- Send an email update to all users that:
  - 2025 predictions are finalized
  - leaderboard is ready to view now
  - 2026 prediction questions will be added later in the year
- Keep message simple and clear, with direct link to leaderboard.

### Phase 2: 2026 Product Expansion
- Add game-to-game predictions for the full Bears season:
  - each game gets its own prediction prompts
  - users can make and update picks by game before deadlines
  - game picks become part of dashboard + scoring views

### Phase 3: Full UX/UI Redesign
- Redesign the full site for a cleaner, easier experience:
  - better layout and spacing
  - clearer navigation and status states
  - more polished mobile and desktop behavior
- Goal: make the app feel easier to use and more modern.

### Phase 4: Fan Confidence Sentiment
- Add a community confidence sentiment indicator per prediction/question.
- Use average confidence across users to show simple labels:
  - High confidence
  - Medium confidence
  - Low confidence
- Show this sentiment alongside existing prediction percentages.

### Notes for Implementation
- Keep this in plain language for users (avoid technical jargon in UI copy).
- Keep scoring rules separate from sentiment:
  - sentiment explains fan confidence
  - scoring still follows official points rules unless intentionally changed later

---

## Change Log

### 2026-02-25 (Roadmap Added)
- Added phased upcoming roadmap:
  - user email announcement for 2025 closeout + leaderboard live
  - 2026 full-season game-to-game predictions
  - full site redesign
  - confidence sentiment feature (high/medium/low) based on community confidence averages

### 2026-02-25 (Follow-up QA)
- Verified end-to-end auth for new account `irfan1+22@gmail.com`:
  - registration succeeded
  - confirmation email received
  - verified and logged in
- Verified authenticated routes load:
  - dashboard works
  - leaderboard works
- Confirmed current product-state behavior:
  - no prediction submissions possible until 2026 questions are created
  - dashboard CTA sends users back to main predictions screen, which currently has no active/new questions
- Logged new admin QA issue:
  - deadline date picker month navigation stuck on February 2026 when creating a question
- Verified admin access and prediction workflow after role fix:
  - admin account now recognized via role-based access
  - admin created a live question successfully
  - user successfully submitted prediction
  - prediction appears in dashboard and can be edited/updated while question is live

### 2026-02-25
- Added UI inconsistency backlog notes from local screenshots:
  - duplicate close icons in auth success modal
  - modal layering overlap with auth footer strip
  - desktop navbar misalignment/wrapping with long email

### 2026-02-22
- Created initial project context document with current app understanding.
- Added Git/GitHub setup status and remaining steps.
- Added product origin story, domain/hosting/email provider details, and primary scoring goal.
- Updated GitHub setup status to reflect successful SSH auth, remote setup, and local/remote parity check.
- Added confirmed Supabase authentication and Brevo SMTP configuration from dashboard screenshots.
- Added official scoring policy: 1 point per correct, confidence excluded from scoring, resolved-only accuracy.
- Added implementation artifacts for simple scoring:
  - Supabase migration: `supabase/migrations/20260222043000_simple_season_scoring.sql`
  - Dashboard metrics updated for 2025 resolved/pending/accuracy in `src/components/Dashboard.tsx`
