export type ClassMeeting = {
  days: string | null;
  time: string | null;
  location: string | null;
};

export type Class = {
  id: string;
  ownerId: string | null;
  courseCode: string | null;
  title: string;
  instructor: string | null;
  meetings: ClassMeeting[];
  saved: boolean;
};

export type MeetingDraft = {
  days: number[];
  startTime: string;
  endTime: string;
  location: string;
};

export type ManualClassDraft = {
  title: string;
  courseCode: string;
  instructor: string;
  meetings: MeetingDraft[];
};

export type ClassView = "schedule" | "catalog";
