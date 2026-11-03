const dayNumbers: Record<string, number> = {
  m: 1,
  tu: 2,
  w: 3,
  th: 4,
  f: 5,
  sa: 6,
  su: 7,
};

type Meeting = {
  days_of_week: number[] | null;
  start_time: string | null;
  end_time: string | null;
  location_text: string | null;
};

function parseTime(value?: string): string | null {
  const match = /^(0?[1-9]|1[0-2]):([0-5]\d)(AM|PM)$/i.exec(value ?? "");
  if (!match) return null;
  const hour =
    (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function parsePisaMeetings(
  dayAndTime: string,
  location: string,
): Meeting[] {
  const locationText = location.trim() || null;
  if (!dayAndTime.trim() && !locationText) return [];
  const lines = dayAndTime.trim() ? dayAndTime.trim().split(/\r?\n/) : [""];
  const meetings: Meeting[] = [];
  for (const line of lines) {
    const match = /^((?:M|Tu|W|Th|F|Sa|Su)+)?\s*(?:(\S+)\s*-\s*(\S+))?$/i.exec(
      line.trim(),
    );
    // Leave unfamiliar schedules in the raw fields instead of guessing.
    if (!match) return [];
    const start = parseTime(match[2]);
    const end = parseTime(match[3]);
    if (match[2] && (!start || !end || end <= start)) return [];
    meetings.push({
      days_of_week:
        match[1]
          ?.match(/Tu|Th|Sa|Su|M|W|F/gi)
          ?.map((day) => dayNumbers[day.toLowerCase()]) ?? null,
      start_time: start,
      end_time: end,
      location_text: locationText,
    });
  }
  return meetings;
}
