import type { SupabaseClient } from "@supabase/supabase-js";

export type ReminderClass = {
  id: number;
  code: string | null;
  name: string;
  class_meetings: {
    id: number;
    days_of_week: number[] | null;
    start_time: string | null;
  }[];
};
export type WeeklyReminder = {
  identifier: string;
  weekday: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
};
export const classReminderPrefix = "slugnav:class:";

export async function getReminderClasses(
  client: SupabaseClient,
  userId: string,
): Promise<ReminderClass[]> {
  const classes: ReminderClass[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from("user_classes")
      .select(
        "class:classes!inner(id, code, name, class_meetings(id, days_of_week, start_time))",
      )
      .eq("user_id", userId)
      .order("class_id")
      .range(offset, offset + 499)
      .overrideTypes<{ class: ReminderClass }[], { merge: false }>();
    if (error) throw error;
    if (!data) throw new Error("Could not read the class schedule.");
    if (!data.length) return classes;
    classes.push(...data.map((row) => row.class));
    offset += data.length;
  }
}

export function buildWeeklyReminders(
  classes: ReminderClass[],
  minutesBefore: number,
  userId: string,
): WeeklyReminder[] {
  if (!Number.isSafeInteger(minutesBefore) || minutesBefore <= 0)
    throw new Error("Invalid reminder lead time.");
  const week = 7 * 24 * 60;
  const reminders: WeeklyReminder[] = [];
  for (const item of classes) {
    for (const meeting of item.class_meetings) {
      const time = meeting.start_time?.match(
        /^([01]\d|2[0-3]):([0-5]\d)(?::00)?$/,
      );
      if (!time) continue;
      for (const day of new Set(meeting.days_of_week ?? [])) {
        if (!Number.isInteger(day) || day < 1 || day > 7) continue;
        // Work in minutes modulo one week, avoiding overflow for large safe integers.
        const start = (day - 1) * 1440 + Number(time[1]) * 60 + Number(time[2]);
        const minuteOfWeek = (start - (minutesBefore % week) + week) % week;
        reminders.push({
          identifier: `${classReminderPrefix}${userId}:${item.id}:${meeting.id}:${day}`,
          weekday: ((Math.floor(minuteOfWeek / 1440) + 1) % 7) + 1,
          hour: Math.floor((minuteOfWeek % 1440) / 60),
          minute: minuteOfWeek % 60,
          title: "Class reminder",
          body: `${item.code || item.name} starts in ${minutesBefore} ${minutesBefore === 1 ? "minute" : "minutes"}.`,
        });
      }
    }
  }
  return reminders;
}
