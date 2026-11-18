import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { PermissionStatus } from "expo";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { sendNotification } from "../../src/lib/notifications";

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));

const granted: Notifications.NotificationPermissionsStatus = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: "never",
};
const denied = { ...granted, status: PermissionStatus.DENIED, granted: false };
const title = "Time to leave";
const body = "Your class starts soon.";

beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(granted);
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue(granted);
  jest
    .mocked(Notifications.scheduleNotificationAsync)
    .mockResolvedValue("notice-1");
});

afterEach(() => jest.restoreAllMocks());

test.each(["ios", "android"] as const)(
  "US-3.4-T-1 AC1: sends the supplied text immediately on %s",
  async (platform) => {
    jest.replaceProperty(Platform, "OS", platform);

    await expect(sendNotification(title, body)).resolves.toBe("notice-1");

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title, body, sound: "default" },
      trigger: platform === "android" ? { channelId: "reminders" } : null,
    });
    if (platform === "android") {
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        "reminders",
        expect.objectContaining({
          importance: Notifications.AndroidImportance.HIGH,
        }),
      );
    }
  },
);

test("US-3.4-T-1 AC1: requests permission and sends when it is granted", async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    ...denied,
    status: PermissionStatus.UNDETERMINED,
  });

  await expect(sendNotification(title, body)).resolves.toBe("notice-1");
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

test("US-3.4-T-1 AC1: respects provisional iOS permission without prompting", async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    ...denied,
    ios: { status: Notifications.IosAuthorizationStatus.PROVISIONAL },
  } as Notifications.NotificationPermissionsStatus);

  await expect(sendNotification(title, body)).resolves.toBe("notice-1");
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

test("US-3.4-T-1 AC1: shows foreground notifications in the banner and list", async () => {
  await sendNotification(title, body);
  const handler = jest.mocked(Notifications.setNotificationHandler).mock
    .calls[0][0];

  await expect(
    handler!.handleNotification({} as Notifications.Notification),
  ).resolves.toEqual({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  });
});

test.each([true, false])(
  "US-3.4-T-1 AC2: does not send when permission is denied (can ask again: %s)",
  async (canAskAgain) => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      ...denied,
      canAskAgain,
    });
    jest
      .mocked(Notifications.requestPermissionsAsync)
      .mockResolvedValue(denied);

    await expect(sendNotification(title, body)).resolves.toBeNull();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(
      canAskAgain ? 1 : 0,
    );
  },
);

test("US-3.4-T-1 AC3: reports a failed notification request to the caller", async () => {
  const error = new Error("Device could not submit the notification");
  jest.mocked(Notifications.scheduleNotificationAsync).mockRejectedValue(error);

  await expect(sendNotification(title, body)).rejects.toBe(error);
});

test("US-3.4-T-1: rejects web requests without calling device APIs", async () => {
  jest.replaceProperty(Platform, "OS", "web");

  await expect(sendNotification(title, body)).rejects.toThrow(
    "Notifications are only supported on iOS and Android.",
  );
  expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});
