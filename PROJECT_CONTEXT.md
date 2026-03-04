# Bears Prediction Tracker - Project Context

Last updated: 2026-03-03
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
  - `qb` (UI mockup tag)
  - `player_stats`
  - `team_stats`
  - `pro_bowlers` (UI mockup tag)
  - `draft_predictions`
  - `playoffs` (UI mockup tag)
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

## 10. Current Priority Order (As Decided 2026-03-02)

Current phase status (as of 2026-03-04):
- Active roadmap phase: **Phase 1 (2025 Season Closeout + User Communication)**.
- Phase 1 completion state: **partially complete**.
- Major done items already verified:
  - role-based admin access is working
  - scoring policy is defined (`1`/`0`, confidence excluded from points)
  - basic scoring/dashboard updates shipped
  - UI redesign pass is now **visually locked** for Home/Navbar/My Predictions/Leaderboard (UI-only)

### Priority 1: Visual Refresh + Mobile Quality
- This priority is explicitly the same as **Phase 3: Full UX/UI Redesign**.
- Redesign the full site for a cleaner, easier experience:
  - better layout and spacing
  - clearer navigation and status states
  - more polished mobile and desktop behavior
- Goal: make the app feel easier to use and more modern.

### Priority 2: User Email List + Announcement Send
- Build/export list of active/registered users.
- Draft announcement email (2025 finalized, leaderboard live, 2026 questions coming later).
- Send to current participants/users.

### Priority 3: Build Out 2026 Questions
- After visual refresh + email send, create and publish 2026 question set.
- Include a dedicated 2026 game-by-game pick flow:
  - users open a game picker experience
  - users submit per-game Bears win/loss picks
  - game picks are included in 2026 prediction tracking/scoring views

### Question Management Operating Decision (Current)
- Do question creation/deadline updates through **Codex/terminal** for now.
- Admin date picker bug is **deferred** and not a current priority.
- Admin UI remains available for occasional spot checks/edits.

### UX/UI Redesign Decisions Locked (Session Notes)
- Selected visual direction: **Halas Desk** style.
- Typography decision: keep current family (`Option A` direction), but use **heavier key text hierarchy** for headers/titles/labels.
- Background decision: keep primary page background **white**.
- Terminology decision: use **fan** language (`Fan Volume`, `Fan Confidence`) instead of "community".
- Interaction decision (cards): keep hybrid actions:
  - quick choice entry points on option labels (`Yes` / `No` and top multiple-choice options)
  - keep primary `Make Prediction` action button on cards.
- Navigation decision:
  - primary nav: `Home`, `Leaderboard`, `My Predictions` (plus `Admin` for admins)
  - de-emphasize `How It Works` (move to footer/secondary location).
- IA decision: do **not** create standalone Account Settings yet.
  - keep display-name edit inline within `My Predictions`.
- Homepage decision: include top banner for season recap discovery:
  - `2025 Fan Results Are Live` + `View Fan Recap` CTA.
- 2026 scope placeholder decision:
  - include **game-by-game pick flow** (users choose Bears win/loss for each game)
  - include these picks in 2026 prediction tracking/scoring views.

### Resume Here (Next Session Starting Point)
1. Redesign UI pass is locked (visual-only) across:
   - Home
   - Navbar
   - My Predictions
   - Leaderboard
2. Keep this phase UI-only:
   - no backend wiring added for recap CTA, tooltip content, or fan confidence aggregation
   - no production scoring behavior rewrites
3. Next build phase:
   - begin data wiring and QA for the finalized UI
   - wire fan-confidence sentiment from real confidence aggregates
   - wire recap/secondary actions as needed
   - validate username display-name flow end-to-end with leaderboard output

Reference mockup artifacts created in this session:
- `mockups-halas-locked-foundation.html` (final typography/foundation baseline)
- `mockups-halas-home-and-my-predictions.html` (approved IA/layout direction)
- `mockups-halas-desk-v2.html` (rich card spec reference)

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

### 2026-03-04 (Redesign Phase Lock - UI Only)
- Completed redesign lock pass and removed temporary preview artifact:
  - removed dev-only fake active question from `src/lib/PredictionContext.tsx`
- Home finalized updates:
  - hero copy updated to `2026 Bears season`
  - recap banner CTA text shortened to `View Recap`
  - recap banner made sticky under navbar
  - topics presentation locked to straight-line style (no bubble toggle)
  - added `Rookies` topic tag
  - card paging controls added (left/right arrows + page count) to reduce long scrolling
- Card/modal interaction finalized:
  - `Details` button removed from home cards
  - removed inline card footer details (`Your call`, `Fan confidence`) from card body
  - unified single primary card action (`Make Prediction` / `View / Edit Prediction` / `View Details`)
  - modal is click-away close (no explicit `X` close icon)
  - compact modal sizing/spacing/typography aligned with card design language
  - removed check/X icon language from answer selections and submit arrow icon
  - added visual-only fan confidence meter preview on cards (dummy data, no backend wiring)
- Navbar finalized updates:
  - removed `How It Works` from primary nav
  - removed redundant `Home` nav button (brand remains home link)
  - simplified icon usage to text-first nav language
  - improved desktop/mobile nav consistency and active states
- My Predictions redesign finalized:
  - shifted to eBay-style left-rail + main-content layout
  - topic filters + status filters (`all`, `active`, `pending`, `resolved`)
  - season switch (`2026` default, `2025` alternate)
  - rows-only presentation (cards view removed)
  - added top metrics (`Total Picks`, `Accuracy`)
  - added username inline edit module backed by `public.users.display_name` (with helper text)
  - added resolved outcome pills (`Correct` / `Incorrect`) in rows
- Leaderboard redesign finalized:
  - restyled leaderboard to match My Predictions visual language
  - removed always-visible tie-rank explainer from subtitle
  - replaced with hover helper: `How we rank`

### 2026-03-03 (Home Mockup Saved + Commit)
- Completed and committed current redesign mockup state on local `main`:
  - commit: `e4ef49b` (`ui: save home and dashboard redesign mockup state`)
- Home updates in current mockup:
  - restored original hero styling/copy with animated underlines
  - moved recap callout to yellow flash banner under navbar
  - updated flash text to `2025 Season Prediction Results Are In`
  - added topic tags for `QB`, `Pro Bowlers`, `Playoffs`, and renamed `Draft Picks` to `Draft`
  - added live comparison toggles for topic filter presentation:
    - `Topics` vs `Bubbles`
    - `Under Nav` vs `Under Hero`
- Prediction cards received a stronger visual refresh (featured treatment, hierarchy, quick-pick entry points) while keeping behavior stable.

### 2026-03-02 (Priority Order Updated)
- Replaced `Now/Next/Later` with explicit ordered priorities:
  - `1) visual refresh + mobile quality`
  - `2) user email list + send`
  - `3) build out 2026 questions`
- Marked admin date picker issue as deferred for now.
- Confirmed question management approach:
  - Codex/terminal-first for question creation and deadline updates.

### 2026-03-02 (Priority Clarification)
- Clarified that "visual refresh" is the same as **Phase 3 Full UX/UI Redesign**.
- Set full UX/UI redesign as the immediate next build focus.

### 2026-03-02 (Design Decisions + Resume Point Captured)
- Logged locked UX/UI decisions from redesign working session (Halas Desk, terminology, nav, interaction model).
- Added explicit "Resume Here" checklist for next chat continuation.
- Added references to approved mockup files for implementation handoff.

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
