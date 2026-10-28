# Class data schema

The [SQL migration](../supabase/migrations/20261028000000_class_schema.sql) defines
the tables, constraints, and row-level security (RLS) policies.

## `classes`

One row per class offering or private manual class.

| Field | Purpose |
| --- | --- |
| `id` | Generated `bigint` primary key, independent of PISA identifiers. |
| `owner_id` | Nullable reference to `auth.users.id`. Null means shared catalog; a user ID means private. |
| `course_code` | Optional full label, such as `CSE 115A - 02`; no separate section field. |
| `title` | Required, nonblank class name. |
| `instructor` | Optional instructor text. |
| `term_code` | Optional integer identifying the PISA quarter, such as `2268` for Fall 2026. |
| `class_number` | Optional integer identifying a PISA enrollment section within that quarter. |

Imports use the unique `(term_code, class_number)` pair to identify an offering.
Private manual/custom classes must supply the owner's user ID and leave
`class_number` null. Customizing a catalog entry means creating a private copy.

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
adds this association. Saving a manual class also creates its private class and
meeting records. Removing an association unsaves the class; it does not delete it.

## Access rules

- Signed-in students can read catalog classes and their own private classes and
  meetings. Only owners can create, edit, or delete private entries.
- Each student can read/add/remove only their own saved associations, and can
  save only classes they can access. Catalog visibility does not reveal who saved it.
- Logged-out requests have no access. Trusted backend/admin access manages the
  catalog; service-role credentials must never be included in the app.
- Foreign keys cascade deletes: deleting a class removes its meetings and saves;
  deleting a user removes their private classes and saved associations.

## Applying the schema

Run the migration once in Supabase SQL Editor. It supports an empty database or
the original catalog schema and preserves existing catalog rows. If the equivalent
SQL was already applied manually, do not run it again. Before adopting CLI-based
deployment, reconcile manually applied SQL with the migration history.

The migration retains the old `days`, `meeting_time`, `building`, and `room`
columns because the current class-list reader still uses them. It does not copy
those values into `class_meetings`. Migrating schedules and updating the reader
are required before removing those columns or displaying new meeting records.

Do not rerun the historical `supabase/classes.sql` after this migration: it adds
sample data and restores an unrestricted read policy.
