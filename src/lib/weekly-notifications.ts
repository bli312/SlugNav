import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { classReminderPrefix, type WeeklyReminder } from "./class-reminders";
import { channelId, prepareNotifications } from "./notifications";

function matches(
  request: Notifications.NotificationRequest,
  reminder: WeeklyReminder,
) {
  const trigger = request.trigger;
  // iOS returns calendar date components even when registered with a weekly input.
  let components:
    { weekday?: number; hour?: number; minute?: number } | undefined;
  if (trigger && "type" in trigger) {
    if (trigger.type === "weekly") components = trigger;
    else if (
      trigger.type === "calendar" &&
      trigger.repeats &&
      "dateComponents" in trigger
    )
      components =
        trigger.dateComponents as Notifications.CalendarNotificationTrigger["dateComponents"];
  }
  return (
    components?.weekday === reminder.weekday &&
    components.hour === reminder.hour &&
    components.minute === reminder.minute &&
    request.content.title === reminder.title &&
    request.content.body === reminder.body
  );
}

// Serialize native mutations so logout cleanup finishes after any in-flight registration.
let deviceWork: Promise<void> = Promise.resolve();
function onDevice(action: () => Promise<void>): Promise<void> {
  const result = deviceWork.then(action, action);
  deviceWork = result.catch(() => {});
  return result;
}

export function clearOtherAccountReminders(
  userId: string | null,
): Promise<void> {
  return onDevice(async () => {
    if (Platform.OS === "web") return;
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of pending) {
      if (
        request.identifier.startsWith(classReminderPrefix) &&
        (!userId ||
          !request.identifier.startsWith(`${classReminderPrefix}${userId}:`))
      ) {
        await Notifications.cancelScheduledNotificationAsync(
          request.identifier,
        );
      }
    }
  });
}

export function syncWeeklyReminders(
  reminders: WeeklyReminder[],
): Promise<void> {
  return onDevice(() => reconcile(reminders));
}

async function reconcile(reminders: WeeklyReminder[]): Promise<void> {
  if (Platform.OS === "web") return;
  await prepareNotifications();
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const wanted = new Map(
    reminders.map((reminder) => [reminder.identifier, reminder]),
  );
  const unchanged = new Set<string>();
  for (const request of pending) {
    if (!request.identifier.startsWith(classReminderPrefix)) continue;
    const reminder = wanted.get(request.identifier);
    if (reminder && matches(request, reminder))
      unchanged.add(request.identifier);
    else
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
  for (const reminder of reminders) {
    if (unchanged.has(reminder.identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.identifier,
      content: { title: reminder.title, body: reminder.body, sound: "default" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: reminder.weekday,
        hour: reminder.hour,
        minute: reminder.minute,
        ...(Platform.OS === "android" ? { channelId } : {}),
      },
    });
  }
  const retained = await Notifications.getAllScheduledNotificationsAsync();
  const own = retained.filter((request) =>
    request.identifier.startsWith(classReminderPrefix),
  );
  if (
    own.length !== wanted.size ||
    own.some(
      (request) =>
        !wanted.has(request.identifier) ||
        !matches(request, wanted.get(request.identifier)!),
    )
  ) {
    throw new Error(
      "The device could not retain all requested class reminders.",
    );
  }
}
