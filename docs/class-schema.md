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

The importer must use `onConflict: "term,class_number"` for upserts and omit `id`
so existing saved associations keep pointing to the same class. Catalog rows have
`owner_id = NULL`. Parsed days, times, and locations belong in `class_meetings`;
manual classes already write there. Keep the raw meeting columns until the
importer and readers no longer need them.

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
empty; populate it with the importer after updating its upsert target above.

The file also installs `create_manual_class`, which uses the signed-in user's
permissions and RLS. Only authenticated users can call it.

For subsequent schema changes, add versioned migrations instead of rerunning this
reset script. Reconcile this manually applied baseline with migration history
before adopting CLI-based deployment.
