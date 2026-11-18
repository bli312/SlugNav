---
id: US-3.2-T-1
story: US-3.2
sprint: 3
assignee: Leo
estimate_hours: 5
---

# Frame of Leaderboard and Point System

## Description
Serves US-3.2 (earn points and compete on leaderboards for campus contributions). This task creates the foundational frame of the leaderboard and point system: Supabase schema and view to track contributions and points, database triggers to automatically award points for campus activities (adding places, photos, comments, and votes), an RPC function to fetch ranked contributors, and the Leaderboard UI screen highlighting the student's own rank and score while guaranteeing privacy by default.

## Specs
- Migration `supabase/migrations/20261117000000_leaderboard.sql` creates:
  - Table `public.user_profiles`:
    - `user_id` (UUID PK, references `auth.users(id)`).
    - `display_name` (optional text up to 32 chars).
    - RLS enabled: public readable by authenticated users; only owner can insert/update.
  - Table `public.user_points`:
    - `id` (bigint generated always as identity).
    - `user_id` (UUID, references `auth.users(id)`).
    - `points` (integer > 0).
    - `category` (text, e.g. `'add_place'`, `'add_photo'`, `'add_comment'`, `'add_vote'`, `'bonus'`).
    - `description` (optional text).
    - `created_at` (timestamptz default now).
    - RLS enabled: authenticated users can read; only owner or triggers can insert.
  - Automatic triggers for contributions:
    - Adding place: 50 points (`add_place`).
    - Adding place photo: 20 points (`add_photo`).
    - Adding place comment: 10 points (`add_comment`).
    - Voting on place: 5 points (`add_vote`).
  - View `public.leaderboard_view`:
    - Computes dense ranks, sums points, counts contributions, joins profile display name (defaulting to anonymous slug `Slug <hex>`).
  - RPC function `public.get_leaderboard(limit_count)`:
    - Returns top ranked contributors with rank, userId, displayName / slug, total points, and contributions count.
  - RPC function `public.get_user_rank(target_user_id)`:
    - Returns current standing for the specific user (rank or null, points, contributions).
- Rollback `supabase/rollbacks/20261117000000_leaderboard.rollback.sql` cleanly drops triggers, functions, view, and tables.
- Client functions in `src/components/leaderboard/leaderboard.ts`:
  - `getLeaderboard(client, limit)`: returns top contributors.
  - `getUserRank(client, userId)`: returns rank summary for student.
  - `updateDisplayName(client, userId, displayName)`: validates and updates profile.
  - `awardUserPoints(client, params)`: inserts points record.
  - `getAnonymousSlug(userId)`: generates anonymous slug like `Slug 4a1b`.
  - `formatPoints(points)`: formats points display.
- UI screen `src/components/leaderboard/LeaderboardScreen.tsx` & route `src/app/leaderboard.tsx`:
  - "YOUR STANDING" highlighted banner showing student's rank, total points, contributions count, and display name.
  - Inline display name editing allowing students to set a custom pseudonym or remain anonymous.
  - Scrollable leaderboard list with medal badges (🥇, 🥈, 🥉) and distinct `(You)` highlight card for the logged-in student.
  - Empty state and retryable error state.
  - Strict privacy: No email addresses or class schedules are exposed.

## Requirements
- Follow `AGENTS.md` and `docs/privacy-and-security.md`: points and contributor rankings are Tier 2 public campus data; student emails and schedules remain strictly private (Tier 1).
- Add new migration and rollback scripts wrapped in `begin; ... commit;`.
- Reusable Supabase client injected into functions for full testability.
- No new runtime dependencies.
- Existing checks and test suites must pass.

## Acceptance Criteria
1. Supabase schema and view track points and contributions per user.
2. Query/RPC function fetches top-ranked contributors.
3. Leaderboard UI screen shows rankings, display names (or anonymous slugs), and point totals.
4. Logged-in student's current rank and total score are highlighted.
5. Strict privacy enforced: no student emails or schedules are exposed.
