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
-- Schema for user_classes join table (linking users to classes)
CREATE TABLE public.user_classes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id bigint NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, class_id)
);

ALTER TABLE public.user_classes ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can only see their own saved classes
CREATE POLICY user_classes_read
ON public.user_classes
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 2. INSERT: Users can only save classes to their own account
CREATE POLICY user_classes_insert
ON public.user_classes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = user_classes.class_id
  )
);

-- 3. DELETE: Users can only remove classes from their own account
CREATE POLICY user_classes_delete
ON public.user_classes
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));
```


### Rule 3.3: No Service Role Key in App
- Only use `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the mobile app.
- Secret keys (such as `BACKEND_SUPABASE_SECRET_KEY` for local scripts) belong only in `.env.local` (never committed) and must NEVER be prefixed with `EXPO_PUBLIC_` or placed in `.env.example`.
- Mobile client code must never import or consume service-role keys.

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
