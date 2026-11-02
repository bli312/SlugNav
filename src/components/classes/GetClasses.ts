import type { SupabaseClient } from "@supabase/supabase-js";
import type { ManualClassDraft, Class } from "./types.ts";
import { manualClassInput } from "./manualClass.ts";
import { toClass, type ClassRow } from "./classData.ts";

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
