---
id: US-3.4-T-1
story: US-3.4
sprint: 3
assignee: Noah
estimate_hours: 3
---

# Send immediate local notifications from the app

## Description
Serves US-3.4 (receive reminders about when to leave for class). This task gives other app code a way to request an immediate local phone notification with supplied text. Calculating whether or when to notify from a student's schedule, location, or preferences belongs to the other task in US-3.4. Scheduling future notifications, server-sent push notifications, and notification settings screens are out of scope.

## Specs
- `sendNotification(title: string, body: string): Promise<string | null>` in `src/lib/notifications.ts` requests one immediate local notification on iOS or Android, preserving the supplied title and message body.
- When permission is already allowed, sending does not prompt again. Otherwise, it requests permission if the operating system allows another prompt. If permission remains denied, it returns `null` without submitting a notification.
- When the operating system accepts the request, the function returns its notification identifier. Acceptance does not confirm that the user saw the notification; device notification settings still apply.
- Foreground notifications use the phone's system banner and notification list, subject to the user's operating-system settings. The helper sends only when called; it does not wake the app or run background work.
- If notification setup, permission access, or submission fails, the returned promise rejects with that error rather than returning an identifier or `null`.
- The device interfaces used by `tests/notifications/notifications.spec.ts` are React Native's `Platform.OS` and `expo-notifications`'s `getPermissionsAsync`, `requestPermissionsAsync`, `setNotificationChannelAsync`, `setNotificationHandler`, and `scheduleNotificationAsync`.

## Requirements
- Use `expo-notifications`, installed with `npx expo install` for the project's Expo version. Include the native configuration needed for installed iOS and Android builds, including an Android notification channel.
- Reuse the existing Jest setup. Tests call the real `sendNotification` helper and mock only the device interfaces, asserting the submitted content, immediate delivery request, foreground display behavior, permission behavior, and returned result or error.
- Keep notification content on the device; no database changes, push tokens, or server credentials are needed.
- Keep the existing web app working; browser notifications are outside this task.
- Existing tests must keep passing. Also verify actual notification display on a phone; mocked tests cannot verify operating-system delivery.

## Acceptance criteria
1. When notification permission is allowed, either beforehand or after a permission request, sending submits exactly one immediate notification containing the supplied title and body and returns its identifier. Foreground notifications use the system banner and notification list, subject to device settings.
2. When notification permission is denied, sending returns `null` and submits no notification. It does not request permission again when the operating system disallows another prompt.
3. If a device notification operation fails, sending rejects with that error instead of returning a successful result.

**Manual verification:** Noah confirmed that calling `sendNotification` from a temporary test button displayed the notification on his phone. The test button was removed afterward.
