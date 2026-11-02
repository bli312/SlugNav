import type { Class } from "./types.ts";
import { weekdays } from "./manualClass.ts";

export type ClassRow = {
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

export function toClass(row: ClassRow): Class {
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
