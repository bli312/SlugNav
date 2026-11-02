import type { SupabaseClient } from "@supabase/supabase-js";
import type { ManualClassDraft, Class } from "./types.ts";
import { manualClassInput, weekdays } from "./manualClass.ts";

type ClassRow = {
  id: number;
  owner_id: string | null;
  code: string | null;
  name: string;
  instructor_name: string | null;
  location: string | null;
  day_and_time: string | null;
  class_meetings: {
    id: number;
    days_of_week: number[] | null;
    start_time: string | null;
    end_time: string | null;
    location_text: string | null;
  }[];
  user_classes: { user_id: string }[];
};

function toClass(row: ClassRow): Class {
  const meetings = [...row.class_meetings]
    .sort((a, b) => a.id - b.id)
    .map((meeting) => ({
      days:
        meeting.days_of_week?.map((day) => weekdays[day - 1]).join(", ") ||
        null,
      time:
        meeting.start_time && meeting.end_time
          ? `${meeting.start_time.slice(0, 5)}–${meeting.end_time.slice(0, 5)}`
          : meeting.start_time
            ? `From ${meeting.start_time.slice(0, 5)}`
            : meeting.end_time
              ? `Until ${meeting.end_time.slice(0, 5)}`
              : null,
      location: meeting.location_text,
    }));

  // Imported classes can have raw meeting text before structured meetings are available.
  if (!meetings.length && (row.day_and_time || row.location)) {
    meetings.push({
      days: null,
      time: row.day_and_time,
      location: row.location,
    });
  }
  return {
    id: String(row.id),
    ownerId: row.owner_id,
    courseCode: row.code,
    title: row.name,
    instructor: row.instructor_name,
    meetings,
    saved: row.user_classes.length > 0,
  };
}

export async function getClasses(client: SupabaseClient): Promise<Class[]> {
  const classes: Class[] = [];
  const pageSize = 500;
  while (true) {
    const { data, error } = await client
      .from("classes")
      .select(
        "id, owner_id, code, name, instructor_name, location, day_and_time, class_meetings(id, days_of_week, start_time, end_time, location_text), user_classes(user_id)",
      )
      .order("code")
      .order("id")
      .range(classes.length, classes.length + pageSize - 1)
      .overrideTypes<ClassRow[], { merge: false }>();
    if (error) throw error;
    if (!data?.length) return classes;
    classes.push(...data.map(toClass));
  }
}

export async function saveClass(
  client: SupabaseClient,
  userId: string,
  classId: string,
) {
  const { error } = await client
    .from("user_classes")
    .upsert(
      { user_id: userId, class_id: classId },
      { onConflict: "user_id,class_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function removeClass(
  client: SupabaseClient,
  userId: string,
  item: Class,
) {
  const query =
    item.ownerId === userId
      ? client.from("classes").delete().eq("id", item.id).eq("owner_id", userId)
      : client
          .from("user_classes")
          .delete()
          .eq("user_id", userId)
          .eq("class_id", item.id);
  const { error } = await query;
  if (error) throw error;
}

export async function createManualClass(
  client: SupabaseClient,
  draft: ManualClassDraft,
): Promise<Class> {
  const { data, error } = await client.rpc(
    "create_manual_class",
    manualClassInput(draft),
  );
  if (error) throw error;
  return toClass(data as ClassRow);
}
