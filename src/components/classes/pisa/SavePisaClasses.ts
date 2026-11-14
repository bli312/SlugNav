import type { SupabaseClient } from "@supabase/supabase-js";
import type { PisaClass } from "./PisaElements.ts";
import { parsePisaMeetings } from "./parse/ParsePisaMeetings.ts";

export async function savePisaClasses(
  client: SupabaseClient,
  classes: PisaClass[],
  term: number,
) {
  if (!classes.length) {
    throw new Error("PISA returned no classes; nothing was imported.");
  }

  const formattedClasses = classes.map((item) => ({
    code: item.code,
    name: item.name,
    class_number: item.number,
    location: item.meetingInfo.location,
    day_and_time: item.meetingInfo.dayAndTime,
    instructor_name: item.instructor.name,
    meetings: parsePisaMeetings(
      item.meetingInfo.dayAndTime,
      item.meetingInfo.location,
    ),
  }));
  const { data, error } = await client.rpc("import_pisa_classes", {
    p_term: term,
    p_classes: formattedClasses,
  });
  return { formattedClasses, data, error };
}
