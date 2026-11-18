import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  contributionsCount: number;
}

export interface UserRankSummary {
  rank: number | null;
  userId: string;
  displayName: string;
  totalPoints: number;
  contributionsCount: number;
}

export function getAnonymousSlug(userId: string): string {
  if (!userId) return "Anonymous Slug";
  const hex = userId.replace(/-/g, "").slice(0, 4);
  return `Slug ${hex}`;
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pt${points === 1 ? "" : "s"}`;
}

export async function getLeaderboard(
  client: SupabaseClient,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await client.rpc("get_leaderboard", {
    limit_count: limit,
  });

  if (error) {
    // Graceful fallback to view if RPC fails or during alternative schema access
    const { data: viewData, error: viewError } = await client
      .from("leaderboard_view")
      .select("rank, user_id, display_name, total_points, contributions_count")
      .order("rank", { ascending: true })
      .limit(limit);

    if (viewError) {
      throw new Error("Could not load leaderboard.");
    }

    return (viewData ?? []).map((row: Record<string, unknown>) => ({
      rank: Number(row.rank),
      userId: String(row.user_id),
      displayName:
        String(row.display_name || "") || getAnonymousSlug(String(row.user_id)),
      totalPoints: Number(row.total_points ?? 0),
      contributionsCount: Number(row.contributions_count ?? 0),
    }));
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    rank: Number(row.rank),
    userId: String(row.user_id),
    displayName:
      String(row.display_name || "") || getAnonymousSlug(String(row.user_id)),
    totalPoints: Number(row.total_points ?? 0),
    contributionsCount: Number(row.contributions_count ?? 0),
  }));
}

export async function getUserRank(
  client: SupabaseClient,
  userId: string,
): Promise<UserRankSummary> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const { data, error } = await client.rpc("get_user_rank", {
    target_user_id: userId,
  });

  if (error || !data || data.length === 0) {
    // If user has not ranked yet or query encounters an error, return default unranked state
    return {
      rank: null,
      userId,
      displayName: getAnonymousSlug(userId),
      totalPoints: 0,
      contributionsCount: 0,
    };
  }

  const row = data[0] as Record<string, unknown>;
  return {
    rank: row.rank != null ? Number(row.rank) : null,
    userId: String(row.user_id),
    displayName:
      String(row.display_name || "") || getAnonymousSlug(String(row.user_id)),
    totalPoints: Number(row.total_points ?? 0),
    contributionsCount: Number(row.contributions_count ?? 0),
  };
}

export async function updateDisplayName(
  client: SupabaseClient,
  userId: string,
  rawName: string,
): Promise<string> {
  if (!userId) {
    throw new Error("Sign in to update your display name.");
  }

  const trimmed = rawName.trim();
  if (trimmed === "") {
    throw new Error("Display name cannot be blank.");
  }
  if (trimmed.length > 32) {
    throw new Error("Display name must be 32 characters or fewer.");
  }

  const { error } = await client.from("user_profiles").upsert(
    {
      user_id: userId,
      display_name: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error("Could not update display name.");
  }

  return trimmed;
}
