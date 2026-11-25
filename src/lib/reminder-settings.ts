import type { SupabaseClient } from "@supabase/supabase-js";

export type ReminderSettings = { enabled: boolean; minutesBefore: number };

export function validateReminderSettings(settings: ReminderSettings) {
  if (
    typeof settings.enabled !== "boolean" ||
    !Number.isSafeInteger(settings.minutesBefore) ||
    settings.minutesBefore <= 0
  ) {
    throw new Error(
      "Enter a positive whole number of minutes within the supported range.",
    );
  }
}

export async function readReminderSettings(
  client: SupabaseClient,
  userId: string,
): Promise<ReminderSettings> {
  const { data, error } = await client
    .from("notification_preferences")
    .select("enabled, minutes_before")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data === null) return { enabled: false, minutesBefore: 30 };
  const settings = {
    enabled: data.enabled,
    minutesBefore: data.minutes_before,
  };
  validateReminderSettings(settings);
  return settings;
}

export async function writeReminderSettings(
  client: SupabaseClient,
  userId: string,
  settings: ReminderSettings,
): Promise<void> {
  validateReminderSettings(settings);
  const { error } = await client.from("notification_preferences").upsert(
    {
      user_id: userId,
      enabled: settings.enabled,
      minutes_before: settings.minutesBefore,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
