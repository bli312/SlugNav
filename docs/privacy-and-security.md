# Privacy and Security Best Practices

**Project:** SlugNav (UCSC CSE 115A)  
**Story Reference:** Story 2.3 — User Account and Class Privacy  
**Last Updated:** Sprint 2 (October 2026)  
**Status:** Approved Team Standard  

---

## 1. Executive Summary

SlugNav handles student academic and campus data. Under university privacy expectations and FERPA principles, student schedules, personal locations, and account details are sensitive personal data.

**Core Rule:** All personal data is **Private by Default**. A student's schedule, saved classes, and account data must never be visible to other students unless the owner explicitly opts into sharing.

---

## 2. Data Classification

Every piece of data stored in SlugNav falls into one of three tiers:

| Tier | Examples | Access Policy | Storage Location |
|---|---|---|---|
| **Tier 1: Private Student Data** | User enrolled classes (`user_classes`), custom schedule notes, saved routes, account email | **Owner only** (`auth.uid() = user_id`). Never queryable by other students. | Supabase tables with strict RLS |
| **Tier 2: Public / Campus Data** | Campus building coordinates, classroom numbers, amenities (water fountains, restrooms), community reviews/photos | **Publicly readable** by authenticated UCSC users. Writes/deletes restricted to creator. | Supabase tables with RLS |
| **Tier 3: Secrets & System Credentials** | Supabase Service Role Key, Google OAuth Client Secret, JWT signing secrets | **Server/Dashboard only**. Never shipped in client bundle or committed to Git. | Supabase Dashboard / Local `.env.local` |

---

## 3. Database Rules (Supabase & PostgreSQL)

Because client apps can be inspected or reverse-engineered, **frontend checks alone do not provide security**. All data security must be enforced by PostgreSQL Row-Level Security (RLS).

### Rule 3.1: RLS is Mandatory on Every Table
Every new table introduced via migration must immediately enable RLS:
```sql
ALTER TABLE public.user_classes ENABLE ROW LEVEL SECURITY;
```

### Rule 3.2: Private Data Must Use `auth.uid()`
Supabase populates `auth.uid()` from the user's verified JWT. For private tables, always enforce ownership:

```sql
-- Example for user_classes table (Story 2.2 / 2.3)
CREATE TABLE public.user_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id text NOT NULL,
  location text,
  meeting_days text[],
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_classes ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can only see their own classes
CREATE POLICY "Users can view only their own classes"
ON public.user_classes
FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT: Users can only insert for their own user_id
CREATE POLICY "Users can insert their own classes"
ON public.user_classes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can only update their own classes
CREATE POLICY "Users can update their own classes"
ON public.user_classes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Users can only delete their own classes
CREATE POLICY "Users can delete their own classes"
ON public.user_classes
FOR DELETE
USING (auth.uid() = user_id);
```

### Rule 3.3: Crowd-Sourced Classrooms & Community Data (Stories 2.4 & Moderation)
SlugNav uses a **Peer-Verified Crowdsourcing Model** with Admin moderation for community classrooms and amenities:

1. **Lifecycle States**:
   - `pending`: Newly submitted by a student. Visible to all students with a clear `"Pending Verification"` badge.
   - `approved`: Confirmed by an admin. Becomes official campus infrastructure data.
   - `rejected`: Marked invalid/malicious by an admin. Hidden from public view.

2. **Access & Mutation Policies**:
   - **Visibility (SELECT)**: All authenticated `@ucsc.edu` users can view `approved` and `pending` classrooms. `rejected` items are hidden from non-admin users.
   - **Creator Permissions (Locking After Approval)**:
     - While `status = 'pending'`, the creator may update details or delete (undo) their submission.
     - **Once `status = 'approved'`, the creator cannot undo, edit, or delete the submission.** It becomes locked community data to prevent disruptive deletions.
   - **Admin Permissions**: Only users with the `admin` role can change the `status` to `approved`/`rejected`, or edit/delete approved classrooms.

3. **Peer Confirmation & Voting Integrity (Story 2.4)**:
   - Students can verify that a pending classroom genuinely exists.
   - **Anti-Tampering Rule**: Peer confirmations must be recorded in a dedicated table (e.g. `classroom_confirmations`) with a unique constraint `UNIQUE(classroom_id, user_id)` so each student can only confirm once. Self-confirmations should be disallowed or excluded from trust scores.

```sql
-- RLS Example for Crowd-Sourced Classrooms
ALTER TABLE public.custom_classrooms ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Students see approved and pending classrooms (admins see all)
CREATE POLICY "View approved and pending classrooms"
ON public.custom_classrooms
FOR SELECT
USING (
  status IN ('approved', 'pending')
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 2. INSERT: Students can submit with status enforced as 'pending'
CREATE POLICY "Students submit pending classrooms"
ON public.custom_classrooms
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND status = 'pending'
);

-- 3. UPDATE: Creators can edit only while pending; Admins can edit anytime
CREATE POLICY "Creators edit while pending; Admins edit anytime"
ON public.custom_classrooms
FOR UPDATE
USING (
  (auth.uid() = created_by AND status = 'pending')
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 4. DELETE: Creators can undo only while pending; Admins can delete anytime
CREATE POLICY "Creators delete while pending; Admins delete anytime"
ON public.custom_classrooms
FOR DELETE
USING (
  (auth.uid() = created_by AND status = 'pending')
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
```

### Rule 3.4: No Service Role Key in App
- Only use `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the mobile app.
- Never place `SUPABASE_SERVICE_ROLE_KEY` inside `.env.local` or any `EXPO_PUBLIC_` variable.

---

## 4. Frontend & Mobile Practices (React Native & Expo)

1. **Defense in Depth**:
   - Filter data in frontend queries (`.eq('user_id', user.id)`) for clean UX, but rely on Supabase RLS as the authoritative barrier.
2. **No Personally Identifiable Information (PII) in Logs**:
   - Do not print student names, `@ucsc.edu` emails, class enrollment lists, or exact GPS coordinates with `console.log` in production or shared logs.
3. **Session and Storage Safety**:
   - `AsyncStorage` is unencrypted on device disk. Do not store sensitive student information (like private notes or passwords) in plain `AsyncStorage`. Use Supabase Auth session management which safely handles JWT refreshes.

---

## 5. Sharing & Consent Guidelines (Opt-In Model)

1. **Default State**:
   - All class schedules and personal routes are strictly private upon creation.
2. **Explicit Consent (Future Sharing Feature)**:
   - If a feature allows sharing schedules with classmates or friends, it must require explicit opt-in action by the user.
   - Sharing must be revocable at any time (e.g., toggling privacy switch or deleting a shared link token).
   - Never expose email addresses or real names without user consent.

---

## 6. Development & Git Workflow

1. **Synthetic Data Only**:
   - When writing Jest unit tests, integration tests, or seeding local database data, use synthetic dummy accounts (e.g., `test-student@ucsc.edu`) and fictional schedules. Never copy real classmates' schedules into tests.
2. **Secrets Out of Version Control**:
   - Never commit `.env.local` or credential files. Verify `git status` before committing.
3. **Testing Access Controls**:
   - When submitting a PR with a new table or API endpoint, verify access with two separate test accounts:
     - User A must be able to view their own records.
     - User B must receive an empty result or permission error when attempting to access User A's records.
