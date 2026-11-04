import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaceType } from "./places.ts";

export interface VoteChoice {
  value: string;
  label: string;
}

export interface VoteOptionDefinition {
  key: string;
  label: string;
  choices: VoteChoice[];
}

export const placeVoteDefinitions: Record<PlaceType, VoteOptionDefinition[]> = {
  classroom: [
    {
      key: "outlets",
      label: "Outlets",
      choices: [
        { value: "none", label: "None" },
        { value: "few", label: "Few" },
        { value: "many", label: "Many" },
      ],
    },
    {
      key: "projector",
      label: "Projector",
      choices: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "wheelchair",
      label: "Wheelchair Accessible",
      choices: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ],
  bathroom: [
    {
      key: "gender",
      label: "Gender Type",
      choices: [
        { value: "all_gender", label: "All-gender" },
        { value: "single_gender", label: "single-gender" },
        { value: "single_stall", label: "Single-stall/room" },
      ],
    },
    {
      key: "feminine_products",
      label: "Menstrual Products",
      choices: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "cleanliness",
      label: "Cleanliness",
      choices: [
        { value: "clean", label: "Clean" },
        { value: "average", label: "Average" },
        { value: "needs_cleaning", label: "Needs cleaning" },
      ],
    },
  ],
  water_fountain: [
    {
      key: "bottle_filler",
      label: "Bottle Filler",
      choices: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      key: "temperature",
      label: "Water Temperature",
      choices: [
        { value: "cold", label: "Chilled (Cold)" },
        { value: "room_temp", label: "Room Temp" },
      ],
    },
  ],
};

export const reportReasons = {
  inaccurate: "Inaccurate location or details",
  inappropriate: "Inappropriate or offensive content",
  duplicate: "Duplicate place",
  closed: "Closed or removed",
  other: "Other issue",
} as const;

export type ReportReason = keyof typeof reportReasons;

export interface OptionVoteSummary {
  counts: Record<string, number>;
  total: number;
  userChoice: string | null;
}

export interface PlaceComment {
  id: number;
  placeId: number;
  userId: string;
  content: string;
  createdAt: string;
}

export interface PlaceFeedback {
  votes: Record<string, OptionVoteSummary>;
  comments: PlaceComment[];
  hasReported: boolean;
}

export async function getPlaceFeedback(
  client: SupabaseClient,
  placeId: number,
  userId?: string,
): Promise<PlaceFeedback> {
  const [votesRes, commentsRes, reportsRes] = await Promise.all([
    client
      .from("place_votes")
      .select("option_key, choice, user_id")
      .eq("place_id", placeId),
    client
      .from("place_comments")
      .select("id, place_id, user_id, content, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false }),
    userId
      ? client
          .from("place_reports")
          .select("id")
          .eq("place_id", placeId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (votesRes.error) throw votesRes.error;
  if (commentsRes.error) throw commentsRes.error;
  if (reportsRes.error) throw reportsRes.error;

  const votes: Record<string, OptionVoteSummary> = {};
  for (const row of votesRes.data ?? []) {
    const key = row.option_key as string;
    const choice = row.choice as string;
    if (!votes[key]) {
      votes[key] = { counts: {}, total: 0, userChoice: null };
    }
    votes[key].counts[choice] = (votes[key].counts[choice] ?? 0) + 1;
    votes[key].total += 1;
    if (userId && row.user_id === userId) {
      votes[key].userChoice = choice;
    }
  }

  const comments: PlaceComment[] = (commentsRes.data ?? []).map((row) => ({
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
  }));

  return {
    votes,
    comments,
    hasReported: Boolean(reportsRes.data),
  };
}

export async function castVote(
  client: SupabaseClient,
  placeId: number,
  optionKey: string,
  choice: string,
): Promise<void> {
  const { error } = await client.from("place_votes").upsert(
    {
      place_id: placeId,
      option_key: optionKey,
      choice,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "place_id,user_id,option_key" },
  );
  if (error) throw new Error(error.message || "Could not submit vote.");
}

export async function postComment(
  client: SupabaseClient,
  placeId: number,
  content: string,
): Promise<PlaceComment> {
  const text = content.trim();
  if (!text) throw new Error("Comment cannot be empty.");
  if (text.length > 500) throw new Error("Comment must be 500 characters or fewer.");

  const { data, error } = await client
    .from("place_comments")
    .insert({
      place_id: placeId,
      content: text,
    })
    .select("id, place_id, user_id, content, created_at")
    .single();

  if (error) throw new Error("Could not post comment.");
  return {
    id: data.id,
    placeId: data.place_id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function deleteVote(
  client: SupabaseClient,
  placeId: number,
  optionKey: string,
): Promise<void> {
  const { error } = await client
    .from("place_votes")
    .delete()
    .eq("place_id", placeId)
    .eq("option_key", optionKey);
  if (error) throw new Error(error.message || "Could not remove vote.");
}

export async function deleteComment(
  client: SupabaseClient,
  commentId: number,
): Promise<void> {
  const { error } = await client
    .from("place_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message || "Could not delete comment.");
}

export async function submitReport(
  client: SupabaseClient,
  placeId: number,
  reason: ReportReason,
  details?: string,
): Promise<void> {
  if (!Object.hasOwn(reportReasons, reason)) {
    throw new Error("Invalid report reason.");
  }
  const text = details?.trim() || null;
  if (text && text.length > 500) {
    throw new Error("Details must be 500 characters or fewer.");
  }

  const { error } = await client.from("place_reports").insert({
    place_id: placeId,
    reason,
    details: text,
  });

  if (error) throw new Error(error.message || "Could not submit report.");
}

export interface UserVoteSubmission {
  id: number;
  placeId: number;
  placeName: string;
  placeType: string;
  optionKey: string;
  choice: string;
  updatedAt: string;
}

export interface UserCommentSubmission {
  id: number;
  placeId: number;
  placeName: string;
  placeType: string;
  content: string;
  createdAt: string;
}

export interface UserReportSubmission {
  id: number;
  placeId: number;
  placeName: string;
  placeType: string;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
}

export interface UserSubmissions {
  votes: UserVoteSubmission[];
  comments: UserCommentSubmission[];
  reports: UserReportSubmission[];
}

export async function getUserSubmissions(
  client: SupabaseClient,
  userId: string,
): Promise<UserSubmissions> {
  const [votesRes, commentsRes, reportsRes] = await Promise.all([
    client
      .from("place_votes")
      .select("id, place_id, option_key, choice, updated_at, places(id, name, type)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    client
      .from("place_comments")
      .select("id, place_id, content, created_at, places(id, name, type)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("place_reports")
      .select("id, place_id, reason, details, created_at, places(id, name, type)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (votesRes.error) {
    throw new Error(votesRes.error.message || "Could not load votes.");
  }
  if (commentsRes.error) {
    throw new Error(commentsRes.error.message || "Could not load comments.");
  }
  if (reportsRes.error) {
    throw new Error(reportsRes.error.message || "Could not load reports.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votes: UserVoteSubmission[] = (votesRes.data ?? []).map((row: any) => {
    const place = Array.isArray(row.places) ? row.places[0] : row.places;
    return {
      id: row.id,
      placeId: row.place_id,
      placeName: place?.name ?? `Place #${row.place_id}`,
      placeType: place?.type ?? "other",
      optionKey: row.option_key,
      choice: row.choice,
      updatedAt: row.updated_at,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments: UserCommentSubmission[] = (commentsRes.data ?? []).map((row: any) => {
    const place = Array.isArray(row.places) ? row.places[0] : row.places;
    return {
      id: row.id,
      placeId: row.place_id,
      placeName: place?.name ?? `Place #${row.place_id}`,
      placeType: place?.type ?? "other",
      content: row.content,
      createdAt: row.created_at,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reports: UserReportSubmission[] = (reportsRes.data ?? []).map((row: any) => {
    const place = Array.isArray(row.places) ? row.places[0] : row.places;
    return {
      id: row.id,
      placeId: row.place_id,
      placeName: place?.name ?? `Place #${row.place_id}`,
      placeType: place?.type ?? "other",
      reason: row.reason,
      details: row.details,
      createdAt: row.created_at,
    };
  });

  return { votes, comments, reports };
}
