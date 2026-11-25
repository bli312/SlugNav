import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const channelId = "reminders";

function hasPermission(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function prepareNotifications() {
  if (Platform.OS === "web") {
    throw new Error("Notifications are only supported on iOS and Android.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function notificationPermission(ask: boolean): Promise<boolean> {
  let permission = await Notifications.getPermissionsAsync();
  if (ask && !hasPermission(permission) && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  }
  return hasPermission(permission);
}

export async function sendNotification(
  title: string,
  body: string,
): Promise<string | null> {
  await prepareNotifications();
  if (!(await notificationPermission(true))) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: Platform.OS === "android" ? { channelId } : null,
  });
}
