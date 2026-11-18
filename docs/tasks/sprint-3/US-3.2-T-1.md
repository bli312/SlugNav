---
id: US-3.2-T-1
story: US-3.2
sprint: 3
assignee: Leo
estimate_hours: 5
---

# Award contribution points and display campus leaderboard rankings

## Description
Serves US-3.2 (earn points and compete on leaderboards for campus contributions). This slice covers tracking contribution points in Supabase, automatically awarding points when students contribute to the campus map (adding places, photos, comments, and votes), an RPC query to compute rankings with anonymous identifiers, and building the Leaderboard UI screen highlighting the logged-in student's standing and score.

Out of scope: redeeming points for rewards or prizes; seasonal or weekly leaderboard resets; achievement badges; and friend-only or private group leaderboards.

## Specs
- Migration `supabase/migrations/20261117000000_leaderboard.sql` creates:
  - Table `public.user_profiles`:
    - Columns: `user_id` (UUID PK, references `auth.users(id)`), `display_name` (optional text up to 32 characters, trimmed), `created_at`, `updated_at`.
    - RLS enabled: signed-in users can read all profiles (`user_profiles_read`); only the authenticated owner can insert (`user_profiles_insert`) or update (`user_profiles_update`).
  - Table `public.user_points`:
    - Columns: `id` (bigint PK), `user_id` (UUID, references `auth.users(id)`), `points` (integer > 0), `category` (text, non-empty), `description` (optional text up to 250 chars), `reference_type` (text), `reference_id` (text), `created_at`.
    - Unique constraint on `(user_id, reference_type, reference_id)` preventing duplicate awards.
    - Index on `user_id`.
    - RLS and permissions: authenticated users have SELECT permission only. Client-side INSERT is completely revoked; points can ONLY be awarded or removed through trusted database triggers (`security definer`), preventing clients from giving themselves arbitrary points.
  - Triggers and point rules on existing contribution tables (awards points on create, reverses points on delete):
    - `places`: +50 points on insert (`add_place`), -50 points on delete.
    - `place_photos`: +20 points on insert (`add_photo`), -20 points on delete.
    - `place_comments`: +10 points on insert (`add_comment`), -10 points on delete.
    - `place_votes`: +5 points on insert (`add_vote`), -5 points on delete (unliking removes credit; prevents infinite point farming). Votes are validated against allowed options and choices for the place's type (or global `like:liked`) via `is_valid_place_vote()` and `trg_validate_place_vote`; invalid or invented vote options/choices are rejected in the database and award no points.
  - View `public.leaderboard_view`: computes `dense_rank() over (order by total_points desc, contributions_count desc, user_id asc)`, joins `display_name`, and falls back to deterministic anonymous slugs `Slug <first-4-hex-of-user-id>`.
  - RPC function `public.get_leaderboard(limit_count integer default 50)`: returns table of `{ rank, user_id, display_name, total_points, contributions_count }`. Only callable by authenticated users and service_role.
  - RPC function `public.get_user_rank(target_user_id uuid default auth.uid())`: returns the target student's rank, display name/slug, total points, and contributions count. If the student has zero contributions, returns `rank: null`, `total_points: 0`, and `contributions_count: 0`.
- Rollback script `supabase/rollbacks/20261117000000_leaderboard.rollback.sql`: cleanly drops functions, view, triggers, and tables in a single transaction.
- Client functions in `src/components/leaderboard/leaderboard.ts`:
  - `getLeaderboard(client, limit)`: calls `get_leaderboard` RPC; falls back to querying `leaderboard_view` if RPC is unavailable; maps fields to camelCase.
  - `getUserRank(client, userId)`: calls `get_user_rank` RPC and returns `{ rank, userId, displayName, totalPoints, contributionsCount }`. Rejects empty `userId`.
  - `updateDisplayName(client, userId, displayName)`: trims name, validates length (1–32 chars), and upserts `public.user_profiles`. Rejects blank strings or names longer than 32 characters.
  - `getAnonymousSlug(userId)`: returns `"Slug " + hex` (e.g. `Slug 4a1b`).
  - `formatPoints(points)`: formats points display (e.g. `150 pts`, `1 pt`).
- UI screen `src/components/leaderboard/LeaderboardScreen.tsx` & route `src/app/leaderboard.tsx`:
  - Top "YOUR STANDING" card: displays the logged-in student's rank badge (🥇, 🥈, 🥉 or `#N`), total points, contribution count, and display name.
  - Displays an "Edit Display Name" button opening an inline input to set/update a custom display name.
  - Scrollable leaderboard list: displays ranked campus contributors with medal badges, display names / anonymous slugs, contribution counts, and point totals.
  - Highlights the current student's card in the rankings list with green accent border, light green background, and a `You` badge.
  - Displays empty state ("No Contributors Yet") when no one has points.
  - Displays error banner with a "Retry" button on network/fetch failure.
  - Navigation: added "Leaderboard" button to `AccountHeader.tsx` on the home map screen.

## Requirements
- Follow `AGENTS.md` and `docs/privacy-and-security.md`: points and contributor rankings are Tier 2 public campus data; student email addresses and course schedules are strictly Tier 1 private data and must NEVER be queried, stored, or exposed on the leaderboard.
- Write reversible database changes: migration in `supabase/migrations/20261117000000_leaderboard.sql` and matching rollback in `supabase/rollbacks/20261117000000_leaderboard.rollback.sql`, both wrapped in `begin; ... commit;`.
- Enforce data security via Supabase Row-Level Security (RLS) on all tables; do not rely on frontend checks alone.
- Use the existing Supabase client from `@/lib/supabase`. No service-role key in mobile app code.
- No new runtime dependencies.
- Existing tests and bundling (`npm run check:scripts` and `expo export`) must keep passing.

## Acceptance criteria
1. Adding a campus place, photo, comment, or valid vote automatically awards points to the user via database triggers; deleting a contribution (such as unliking or deleting a comment/photo/place) reverses the points; invented or invalid vote options/choices are rejected in the database and award no unearned points; direct client-side point insertion is denied; and signed-out requests cannot read points or profiles.
2. `public.get_leaderboard` returns contributors ordered by rank ascending and total points descending, using display names when set and anonymous slugs otherwise.
3. `public.get_user_rank` returns the current user's rank and point totals, or `rank: null` and 0 points if unranked.
4. The Leaderboard UI screen displays the student's standing banner, ranked list of contributors, and marks the current student with a `You` badge and highlight.
5. Updating a display name validates length between 1 and 32 characters, rejects blank input, and updates the profile in `public.user_profiles`.
6. Neither student email addresses nor student schedules are rendered in the leaderboard or exposed by the leaderboard queries.
7. The rollback script cleanly drops all triggers, functions, views, and tables without errors.
