import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const channelId = "reminders";

function hasPermission(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function sendNotification(
  title: string,
  body: string,
): Promise<string | null> {
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

  let permission = await Notifications.getPermissionsAsync();
  if (!hasPermission(permission) && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  }
  if (!hasPermission(permission)) return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: Platform.OS === "android" ? { channelId } : null,
  });
}
