// One class meeting as the app uses it. Optional details are null when the
// catalog doesn't list them (matches the nullable columns in supabase/classes.sql).
export type UcscClass = {
  id: string;
  courseCode: string;
  title: string;
  instructor: string | null;
  days: string | null;
  time: string | null;
  building: string | null;
  room: string | null;
};
