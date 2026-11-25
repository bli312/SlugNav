---
id: US-4.2-T-1
story: US-4.2
sprint: 4
assignee: Noah
estimate_hours: 8
---

# Schedule weekly class reminders from notification settings

## Description

Serves US-4.2 and Scrum card [4.2.1 / #113](https://github.com/bli312/SlugNav/issues/113). Add a Settings page where students enable reminders and choose how many minutes before each saved class meeting to be notified. Save preferences to their Supabase account and schedule weekly local notifications on iOS and Android, preserving the existing immediate-notification helper.

Route/location calculations, backend-sent notifications, instant updates on other devices, automatic term/holiday exceptions, and other settings are out of scope.

## Specs

- The signed-in home **Settings** button opens `/settings`, containing a **Notifications** switch, **Minutes before class** input, and **Save settings**. Defaults are off and 30 minutes. Edits take effect on Save settings.
- Lead time must be a positive whole number of minutes representable as a safe integer. Blank, nonnumeric, fractional, zero, negative, and unsafe values show a validation error without changing saved settings or reminders.
- Preferences are `{ enabled: boolean, minutesBefore: number }`, stored in `public.notification_preferences`: `user_id` (UUID primary key referencing `auth.users`, cascading on account deletion), `enabled` (non-null boolean, default false), and `minutes_before` (non-null bigint, default 30, constrained to 1–9007199254740991). A missing row uses defaults without inserting; failed reads or malformed responses show an error and prevent saving until retried. Save upserts the authenticated user's row; the last committed save wins.
- The following functions define the tested data and scheduling interfaces:

  | File | Function and behavior |
  | --- | --- |
  | `src/lib/reminder-settings.ts` | `readReminderSettings(client, userId)` / `writeReminderSettings(client, userId, settings)` read/upsert that user's preferences, mapping `minutes_before` to `minutesBefore`; invalid data and request failures reject. |
  | `src/lib/class-reminders.ts` | `getReminderClasses(client, userId)` returns all saved classes with class/meeting IDs, code/name, `days_of_week`, and `start_time`; filters `user_classes.user_id` to `userId`, includes all pages, and rejects query errors. |
  | `src/lib/class-reminders.ts` | `buildWeeklyReminders(classes, minutesBefore, userId)` returns `{ identifier, weekday, hour, minute, title, body }[]` with stable identifiers for each account/class/meeting/day. |
  | `src/lib/weekly-notifications.ts` | `syncWeeklyReminders(reminders)` registers missing/changed weekly reminders and cancels obsolete ones; unchanged and unrelated notifications remain untouched. Failures reject. |

- Calculate one repeating reminder per distinct meeting weekday by subtracting the lead time. Database weekdays are Monday = 1 through Sunday = 7; Expo uses Sunday = 1 through Saturday = 7. For a 30-minute offset, Monday/Wednesday/Friday 10:00 produces three 09:30 reminders, and Monday 00:15 produces Sunday 23:45. Separate meeting patterns use their own times; duplicate days within a meeting count once.
- Use structured meeting data only. Missing/invalid weekdays or start times are skipped; an empty schedule produces no reminders. Supported start times are 24-hour `HH:MM` or `HH:MM:00`.
- Notifications have title **Class reminder** and body **CSE 115A starts in 30 minutes.**, substituting the class code (or name), lead time, and singular **minute** when needed. Register recurring weekly rules, not individual dates or immediate notifications. If the device cannot retain the requested reminders, report an update failure.
- Rules repeat indefinitely, including breaks, until changed or cancelled. They use the phone's time zone; Settings explains the Pacific-time assumption for UCSC classes and that device settings can delay or silence alerts.
- OS permission and scheduled rules belong to each device. Request missing permission only during an enabled save when the OS allows prompting. Denial prevents that save, schedules nothing new, and explains how to allow notifications and save again. If a check finds account reminders enabled but permission missing, clear this device's class reminders and show a blocked state; do not change the account preference. Retry after permission is restored.
- `ReminderProvider` / `useReminders` in `src/providers/reminder-provider.tsx` reload preferences and schedule on login, when the app becomes active again, and after successful settings or schedule changes. Failed schedule mutations do not trigger checks. Changes from another device, including disabling reminders, apply at the next successful check; closed devices keep their existing rules until then. Only changed or missing reminders are updated; reopening is not required for weekly delivery.
- Saving off cancels this device's class reminders. Sign-out, session loss, or switching accounts clears the previous account's local reminders but retains its Supabase preferences. Late results from older operations cannot restore obsolete reminders.
- Loading or saving preferences requires connectivity. A failed/unconfirmed preference write keeps current device reminders unchanged and preserves the form for resubmission. If preferences save but reminder updating fails, distinguish those outcomes and offer **Retry**. Failed reads preserve existing reminders for the same account rather than substituting defaults or an empty schedule. Retry rereads saved preferences and reconciles partial device updates. Reminder failures never undo successful class mutations.
- Web displays a native-only explanation, disables notification controls, and invokes no native notification APIs.

UI tests cover `src/app/settings.tsx`, `src/components/settings/SettingsScreen.tsx`, and navigation through `src/components/AccountHeader.tsx`, `src/app/index.tsx`, and `src/app/_layout.tsx`. Lifecycle tests cover the provider, auth changes from `src/providers/auth-provider.tsx`, and schedule mutations in `src/components/classes/class_list/useClasses.ts`.

Mocked boundaries: React Native `Platform.OS`/`AppState.addEventListener`; Supabase requests; Expo Notifications `getPermissionsAsync`, `requestPermissionsAsync`, `setNotificationChannelAsync`, `setNotificationHandler`, `getAllScheduledNotificationsAsync`, `scheduleNotificationAsync`, and `cancelScheduledNotificationAsync`. Database tests execute the migration and rollback below using PGlite.

## Requirements

- Reuse existing dependencies, styling, auth, and notification setup. Keep `sendNotification(title, body)` in `src/lib/notifications.ts` immediate and preserve existing behavior. No new dependencies, Edge Functions, or background server jobs.
- Add `supabase/migrations/20261124000000_notification_preferences.sql` and matching `supabase/rollbacks/20261124000000_notification_preferences.rollback.sql`, both transactional. Enable RLS: authenticated users may select, insert, and update only their own row (`auth.uid() = user_id`), including ownership checks on updates; anonymous users have no access. Preserve existing schedule RLS and explicit owner filtering. Document migration setup in `README.md`.
- Supabase is the preference source; do not duplicate preferences in AsyncStorage or cache/log private schedules. Leave existing auth-session storage intact.
- Use synthetic data and existing Node/Jest tools. Test real behavior with mocked external boundaries, including delayed responses for cancellation races. Every acceptance criterion needs a committed test beginning `US-4.2-T-1` that fails without the corresponding behavior.

  | Test file under `tests/notifications/` | Criteria |
  | --- | --- |
  | `settings.spec.tsx` | 1, 2, 4, 15, 16, 17 |
  | `reminder-settings.spec.ts` | 1, 2, 4, 15 |
  | `reminder-settings-database.test.mjs` | 3, 18 |
  | `class-reminders.test.mjs` | 5, 6, 7 |
  | `weekly-notifications.spec.ts` | 8, 9, 10, 15, 16 |
  | `reminder-provider.spec.tsx` | 2, 11, 12, 13, 14, 15, 16 |

- Run `npm run check:scripts`, the changed-line coverage check, and `npm run export`; existing tests must pass. On installed iOS/Android builds, verify closed-app delivery, delivery after a normal reboot without reopening, and cancellation. Record device/OS results separately from mocked tests. Delivery while powered off or replay of missed occurrences is not required.

## Acceptance criteria

1. Settings opens from the signed-in home screen with notifications off and 30 minutes when no preferences exist.
2. A valid save persists both preferences in Supabase; the same account loads them on another device at its next successful login/activation check.
3. Database access allows owners to read, insert, and update their own preferences, prevents access to another user's preferences, and denies anonymous access.
4. Invalid lead time shows an error without changing saved preferences or reminders.
5. Reminder data includes all of the authenticated user's saved classes, including later result pages, and excludes unsaved classes.
6. Calculation returns the correct weekday/time for each distinct meeting day, including separate meeting patterns and midnight/week rollover.
7. Missing/invalid meeting details contribute no reminders; an empty schedule returns an empty list.
8. With permission allowed, calculated reminders are registered for future weekly delivery with the specified text and timing.
9. Rechecking unchanged settings, schedule, and device state makes no scheduling or cancellation calls.
10. Changed settings/schedules leave the requested class reminders pending without changing unrelated notifications.
11. An enabled save requests missing permission when prompting is allowed; other actions never prompt.
12. Denied permission prevents new reminders and displays instructions without changing saved preferences.
13. Login, app activation, and successful settings/schedule changes reload preferences and schedule, applying remote changes locally; failed schedule mutations do not trigger checks.
14. Disabling reminders or changing/losing the account clears obsolete reminders, including when older operations finish late.
15. Supabase or device failures display an error with the retained state described in Specs, without a false success indication.
16. After a dependency recovers, resubmitting a failed save or retrying a failed reminder update succeeds without duplicates.
17. Web shows the native-only explanation with disabled controls and no native notification calls.
18. The migration enforces the specified defaults and constraints; rollback removes the new table without changing existing tables, and the migration can then be reapplied.
