import { getSupabase } from "@/lib/supabase";

import { mockClasses, Class } from "./mockClasses";

// The screen only calls getClasses(). Set USE_MOCK to true to fall back to
// mock data, e.g. when Supabase isn't set up in .env.local.
const USE_MOCK = false;

// One row of the Supabase `classes` table (see supabase/classes.sql).
type ClassRow = {
  id: number;
  course_code: string;
  title: string;
  instructor: string | null;
  days: string | null;
  meeting_time: string | null;
  building: string | null;
  room: string | null;
};

export async function getClasses(): Promise<Class[]> {
  if (USE_MOCK) {
    return mockClasses;
  }

  const { data, error } = await getSupabase()
    .from("classes")
    .select(
      "id, course_code, title, instructor, days, meeting_time, building, room",
    )
    .order("course_code")
    .overrideTypes<ClassRow[], { merge: false }>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    courseCode: row.course_code,
    title: row.title,
    instructor: row.instructor,
    days: row.days,
    time: row.meeting_time,
    building: row.building,
    room: row.room,
  }));
}
