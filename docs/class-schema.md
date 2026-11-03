# Class data schema

[`supabase/classes.sql`](../supabase/classes.sql) defines the class tables,
constraints, row-level security (RLS) policies, and manual-class creation function.

## `classes`

One row per class offering or private manual class.

| Field | Purpose |
| --- | --- |
| `id` | Generated `bigint` primary key, independent of PISA identifiers. |
| `owner_id` | Nullable reference to `auth.users.id`. Null means shared catalog; a user ID means private. |
| `code` | Optional full label, such as `CSE 115A - 02`; no separate section field. |
| `name` | Required, nonblank class name. |
| `instructor_name` | Optional instructor text. |
| `term` | Optional integer identifying the PISA quarter, such as `2268` for Fall 2026. |
| `class_number` | Optional integer identifying a PISA enrollment section within that quarter. |
| `location`, `day_and_time` | Optional raw PISA meeting text, displayed when there are no `class_meetings` rows. |
| `updated_at` | Timestamp defaulting to insertion time. Writers must set it on updates to record when the row was refreshed. |

Imports use the unique `(term, class_number)` pair to identify an offering.
Private manual/custom classes must supply the owner's user ID and leave
`class_number` null. Every row still has its own generated `id`.

The importer uses `import_pisa_classes` to upsert by `(term, class_number)` and
replace the imported class's meetings in one transaction. Existing class IDs and
saved associations are preserved. Catalog rows have `owner_id = NULL`.
The raw meeting columns remain as a fallback for unrecognized schedule text.

## `class_meetings`

One row per meeting pattern. Monday/Wednesday at one time and Friday at another
are two rows referencing the same class.

| Field | Purpose |
| --- | --- |
| `id` | Generated `bigint` primary key. |
| `class_id` | Required `bigint` reference to `classes.id`. |
| `days_of_week` | Optional `smallint[]`; Monday = 1 through Sunday = 7. |
| `start_time`, `end_time` | Optional local times, interpreted in `America/Los_Angeles`. End must follow start when both are provided. |
| `starts_on`, `ends_on` | Optional dates limiting the schedule to its term/session. End cannot precede start. |
| `location_text` | Optional location as provided, including room names, `Online`, or `TBD`. |

Unknown meeting details stay null. These fields describe a recurring schedule,
not individual dated calendar events.

## `user_classes`

| Field | Purpose |
| --- | --- |
| `user_id` | Required UUID reference to `auth.users.id`. |
| `class_id` | Required `bigint` reference to `classes.id`. |

The pair is the primary key, preventing duplicate saves. Saving a catalog class
adds this association. Creating a manual class also creates its meetings and saved
association in one transaction, using `create_manual_class`.

In the app, removing a catalog class deletes only the saved association. Removing
a manual class deletes the private class; its meetings and association are removed
by cascading foreign keys.

## Access rules

- Signed-in students can read catalog classes and their own private classes and
  meetings. Only owners can create, edit, or delete private entries.
- Each student can read/add/remove only their own saved associations, and can
  save only classes they can access. Catalog visibility does not reveal who saved it.
- Logged-out requests have no access. Trusted backend/admin access manages the
  catalog; service-role credentials must never be included in the app.
- Foreign keys cascade deletes: deleting a class removes its meetings and saves;
  deleting a user removes their private classes and saved associations.

## Setup

Run the complete [`supabase/classes.sql`](../supabase/classes.sql) file in Supabase
SQL Editor after the team agrees to reset class data. **It deletes and recreates
`classes`, `class_meetings`, and `user_classes`, including all saved schedules.**
It does not change user accounts or the Google login setup. The catalog starts
empty; populate it with the importer below.

The file also installs `create_manual_class`, which uses the signed-in user's
permissions and RLS. Only authenticated users can call it.

For subsequent schema changes, add versioned migrations instead of rerunning this
reset script. Reconcile this manually applied baseline with migration history
before adopting CLI-based deployment.

## Importing PISA classes

The local importer writes to `classes`; `pisa_classes` is no longer used.
If the old `pisa_classes.sql` was run, apply
[`20261102000000_remove_public_class_read.sql`](../supabase/migrations/20261102000000_remove_public_class_read.sql)
in Supabase SQL Editor to remove its public-read policy from `classes`.
This preserves existing class data and schedules.

Apply [`20261102010000_import_pisa_meetings.sql`](../supabase/migrations/20261102010000_import_pisa_meetings.sql)
in SQL Editor before importing. It installs `import_pisa_classes`, callable only
by the backend's service role. A failed import rolls back both classes and meetings.

Set `BACKEND_SUPABASE_SECRET_KEY` in `.env.local` to a Supabase secret/service-role
key (never an `EXPO_PUBLIC_` variable). Start Ian's importer with
`npx tsx ./src/lib/server.ts`, then open `http://127.0.0.1:3000/api/classes` to
scrape and import. Each request updates matching catalog rows or inserts new
ones; it does not delete classes or modify saved schedules. `updated_at` records
the import time. The server only listens on your own computer.

Meeting days, local start/end times, and locations populate `class_meetings`.
Each PISA schedule line becomes a meeting row; missing days or times stay null.
Repeated imports replace those catalog meetings, leaving manual classes alone.
Unrecognized schedules stay in the raw columns for display. Meeting dates stay
null because the search results do not supply them.
