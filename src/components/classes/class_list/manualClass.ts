import type { ManualClassDraft, MeetingDraft } from "./types.ts";

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function emptyMeeting(): MeetingDraft {
  return { days: [], startTime: "", endTime: "", location: "" };
}

export function emptyManualClass(): ManualClassDraft {
  return {
    title: "",
    courseCode: "",
    instructor: "",
    meetings: [emptyMeeting()],
  };
}

function normalizeTime(value: string): string | null {
  if (!value.trim()) return null;
  const match = /^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/i.exec(value.trim());
  const hour = Number(match?.[1]);
  const minutes = match?.[2];
  const period = match?.[3]?.toLowerCase();
  if (
    !match ||
    (period ? hour < 1 || hour > 12 : hour > 23 || minutes === undefined)
  ) {
    throw new Error("Enter a time such as 2:00 PM or 14:00.");
  }
  const normalizedHour = period
    ? (hour % 12) + (period === "pm" ? 12 : 0)
    : hour;
  return `${String(normalizedHour).padStart(2, "0")}:${minutes ?? "00"}`;
}

export function manualClassInput(draft: ManualClassDraft) {
  if (!draft.title.trim()) throw new Error("Enter a class name.");

  const meetings = draft.meetings
    .map((meeting) => {
      const start = normalizeTime(meeting.startTime);
      const end = normalizeTime(meeting.endTime);
      if (start && end && end <= start) {
        throw new Error("End time must be after start time.");
      }
      if (
        meeting.days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
      ) {
        throw new Error("Choose valid meeting days.");
      }
      return {
        days_of_week: meeting.days.length
          ? [...new Set(meeting.days)].sort()
          : null,
        start_time: start,
        end_time: end,
        location_text: meeting.location.trim() || null,
      };
    })
    .filter(
      (meeting) =>
        meeting.days_of_week ||
        meeting.start_time ||
        meeting.end_time ||
        meeting.location_text,
    );

  return {
    p_name: draft.title.trim(),
    p_code: draft.courseCode.trim() || null,
    p_instructor_name: draft.instructor.trim() || null,
    p_meetings: meetings,
  };
}
