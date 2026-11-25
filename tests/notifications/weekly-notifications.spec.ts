import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";
import { syncWeeklyReminders } from "../../src/lib/weekly-notifications";
import { buildWeeklyReminders } from "../../src/lib/class-reminders";
import {
  notifications as native,
  pending,
  resetDevice,
  sampleClass,
  type NativeRequest,
} from "./notification-fixtures";

jest.mock(
  "expo-notifications",
  () => jest.requireActual("./notification-fixtures").notifications,
);
const rules = () => buildWeeklyReminders([sampleClass], 30, "alice");
beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  resetDevice();
});
afterEach(() => jest.restoreAllMocks());

test.each(["ios", "android"])(
  "US-4.2-T-1 AC8: registers future weekly rules and shared display setup on %s",
  async (os) => {
    jest.replaceProperty(Platform, "OS", os);
    await syncWeeklyReminders(rules());
    expect(pending.size).toBe(3);
    expect(native.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: rules()[0].identifier,
        content: expect.objectContaining({
          title: "Class reminder",
          body: "CSE 115A starts in 30 minutes.",
          sound: "default",
        }),
        trigger: expect.objectContaining({
          type: "weekly",
          weekday: 2,
          hour: 9,
          minute: 30,
        }),
      }),
    );
    expect(native.requestPermissionsAsync).not.toHaveBeenCalled();
    const handler = native.setNotificationHandler.mock.calls[0][0];
    expect(await handler.handleNotification({})).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
    if (os === "android") {
      expect(native.setNotificationChannelAsync).toHaveBeenCalledWith(
        "reminders",
        expect.objectContaining({ importance: 4 }),
      );
      expect(
        native.scheduleNotificationAsync.mock.calls[0][0].trigger.channelId,
      ).toBe("reminders");
    }
  },
);

test.each(["weekly", "calendar"])(
  "US-4.2-T-1 AC9: rechecking an unchanged native %s rule makes no mutations",
  async (type) => {
    await syncWeeklyReminders(rules());
    if (type === "calendar") {
      for (const request of pending.values())
        request.trigger = {
          type: "calendar",
          repeats: true,
          dateComponents: {
            weekday: request.trigger.weekday,
            hour: request.trigger.hour,
            minute: request.trigger.minute,
          },
        };
    }
    native.scheduleNotificationAsync.mockClear();
    native.cancelScheduledNotificationAsync.mockClear();
    await syncWeeklyReminders(rules());
    expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(native.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  },
);

test("US-4.2-T-1 AC10: changes and missing rules reconcile while unrelated notifications remain", async () => {
  pending.set("unrelated", {
    identifier: "unrelated",
    content: { title: "Other feature" },
    trigger: null,
  });
  await syncWeeklyReminders(rules());
  pending.delete(rules()[0].identifier);
  native.scheduleNotificationAsync.mockClear();
  await syncWeeklyReminders(rules());
  expect(native.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  const changed = buildWeeklyReminders([sampleClass], 45, "alice").slice(0, 2);
  await syncWeeklyReminders(changed);
  expect([...pending.keys()].sort()).toEqual(
    ["unrelated", ...changed.map((r) => r.identifier)].sort(),
  );
  for (const rule of changed)
    expect(pending.get(rule.identifier).trigger.minute).toBe(15);
  await syncWeeklyReminders([]);
  expect([...pending.keys()]).toEqual(["unrelated"]);
});

test("US-4.2-T-1 AC15 AC16: a partially failed update is reported and retry recovers without duplicates", async () => {
  const schedule = native.scheduleNotificationAsync.getMockImplementation();
  native.scheduleNotificationAsync
    .mockImplementationOnce(schedule)
    .mockRejectedValueOnce(new Error("device failed"));
  await expect(syncWeeklyReminders(rules())).rejects.toThrow("device failed");
  expect(pending.size).toBe(1);
  await syncWeeklyReminders(rules());
  expect(pending.size).toBe(3);
  native.cancelScheduledNotificationAsync.mockRejectedValueOnce(
    new Error("cancel failed"),
  );
  await expect(syncWeeklyReminders([])).rejects.toThrow("cancel failed");
  await syncWeeklyReminders([]);
  expect(pending.size).toBe(0);
});

test("US-4.2-T-1 AC15: failure to enumerate or retain requested rules is not reported as success", async () => {
  native.getAllScheduledNotificationsAsync.mockRejectedValueOnce(
    new Error("enumeration failed"),
  );
  await expect(syncWeeklyReminders(rules())).rejects.toThrow(
    "enumeration failed",
  );
  expect(native.scheduleNotificationAsync).not.toHaveBeenCalled();
  native.scheduleNotificationAsync.mockImplementation(
    async (request: NativeRequest) => request.identifier,
  );
  await expect(syncWeeklyReminders(rules())).rejects.toThrow();
});
