import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getSupabase } from "@/lib/supabase";
import { useOptionalAuth } from "@/providers/auth-provider";
import {
  deleteComment,
  deleteVote,
  getUserSubmissions,
  reportReasons,
  type UserCommentSubmission,
  type UserReportSubmission,
  type UserSubmissions,
  type UserVoteSubmission,
} from "./feedback";
import { placeTypes } from "./places";

type Tab = "comments" | "votes" | "reports";

export default function FeedbackReportsScreen() {
  const auth = useOptionalAuth();
  const userId = auth?.session?.user?.id;

  const [activeTab, setActiveTab] = useState<Tab>("comments");
  const [submissions, setSubmissions] = useState<UserSubmissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(null);

    getUserSubmissions(getSupabase(), userId)
      .then((data) => {
        if (active) setSubmissions(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load submissions.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleDeleteComment(commentId: number) {
    setActionError(null);
    try {
      await deleteComment(getSupabase(), commentId);
      setSubmissions((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : prev,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete comment.",
      );
    }
  }

  async function handleDeleteVote(vote: UserVoteSubmission) {
    setActionError(null);
    try {
      await deleteVote(getSupabase(), vote.placeId, vote.optionKey);
      setSubmissions((prev) =>
        prev
          ? {
              ...prev,
              votes: prev.votes.filter(
                (v) =>
                  !(
                    v.placeId === vote.placeId && v.optionKey === vote.optionKey
                  ),
              ),
            }
          : prev,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not remove vote.",
      );
    }
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Sign in Required</Text>
        <Text style={styles.emptySubtitle}>
          Please sign in to view your submitted feedback and reports.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#174B35" />
        <Text style={styles.loadingText}>Loading your submissions…</Text>
      </View>
    );
  }

  const commentsCount = submissions?.comments.length ?? 0;
  const votesCount = submissions?.votes.length ?? 0;
  const reportsCount = submissions?.reports.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={`Comments (${commentsCount})`}
          accessibilityState={{ selected: activeTab === "comments" }}
          onPress={() => setActiveTab("comments")}
          style={[styles.tab, activeTab === "comments" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "comments" && styles.tabTextActive,
            ]}
          >
            💬 Comments ({commentsCount})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={`Votes & Likes (${votesCount})`}
          accessibilityState={{ selected: activeTab === "votes" }}
          onPress={() => setActiveTab("votes")}
          style={[styles.tab, activeTab === "votes" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "votes" && styles.tabTextActive,
            ]}
          >
            🗳️ Votes & Likes ({votesCount})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={`Reports (${reportsCount})`}
          accessibilityState={{ selected: activeTab === "reports" }}
          onPress={() => setActiveTab("reports")}
          style={[styles.tab, activeTab === "reports" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reports" && styles.tabTextActive,
            ]}
          >
            🚩 Reports ({reportsCount})
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      )}

      {actionError && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {actionError}
        </Text>
      )}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "comments" && (
          <CommentsList
            comments={submissions?.comments ?? []}
            onDelete={handleDeleteComment}
          />
        )}

        {activeTab === "votes" && (
          <VotesList
            votes={submissions?.votes ?? []}
            onDelete={handleDeleteVote}
          />
        )}

        {activeTab === "reports" && (
          <ReportsList reports={submissions?.reports ?? []} />
        )}
      </ScrollView>
    </View>
  );
}

function CommentsList({
  comments,
  onDelete,
}: {
  comments: UserCommentSubmission[];
  onDelete: (id: number) => void;
}) {
  if (comments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtitle}>
          Comments you post on classrooms or amenities will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {comments.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>{item.placeName}</Text>
              <Text style={styles.placeBadge}>
                {placeTypes[item.placeType as keyof typeof placeTypes] ??
                  item.placeType}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete comment on ${item.placeName}`}
              onPress={() => onDelete(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
          <Text style={styles.commentBody}>{item.content}</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

function VotesList({
  votes,
  onDelete,
}: {
  votes: UserVoteSubmission[];
  onDelete: (vote: UserVoteSubmission) => void;
}) {
  if (votes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No votes or likes yet</Text>
        <Text style={styles.emptySubtitle}>
          Places you like or vote on will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {votes.map((item) => {
        const isLike = item.optionKey === "like";
        return (
          <View
            key={`${item.placeId}-${item.optionKey}`}
            style={[styles.card, isLike && styles.likeCard]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleGroup}>
                <Text style={styles.cardTitle}>{item.placeName}</Text>
                <Text style={styles.placeBadge}>
                  {placeTypes[item.placeType as keyof typeof placeTypes] ??
                    item.placeType}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isLike
                    ? `Unlike ${item.placeName}`
                    : `Remove vote for ${item.optionKey} on ${item.placeName}`
                }
                onPress={() => onDelete(item)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>
                  {isLike ? "Unlike" : "Remove"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.voteRow}>
              {isLike ? (
                <Text style={styles.likeTag}>❤️ Liked this location</Text>
              ) : (
                <Text style={styles.voteTag}>
                  {item.optionKey}:{" "}
                  <Text style={styles.voteChoice}>{item.choice}</Text>
                </Text>
              )}
            </View>
            <Text style={styles.dateText}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ReportsList({ reports }: { reports: UserReportSubmission[] }) {
  if (reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No reports submitted</Text>
        <Text style={styles.emptySubtitle}>
          Reports you submit for place review will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {reports.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>{item.placeName}</Text>
              <Text style={styles.placeBadge}>
                {placeTypes[item.placeType as keyof typeof placeTypes] ??
                  item.placeType}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Under Review</Text>
            </View>
          </View>
          <Text style={styles.reportReason}>
            Reason:{" "}
            <Text style={styles.boldText}>
              {reportReasons[item.reason] ?? item.reason}
            </Text>
          </Text>
          {Boolean(item.details) && (
            <Text style={styles.reportDetails}>“{item.details}”</Text>
          )}
          <Text style={styles.dateText}>
            Submitted on {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F5" },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E4",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#174B35",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#526259",
  },
  tabTextActive: {
    color: "#174B35",
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  list: { gap: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7DFD8",
    padding: 14,
    gap: 8,
  },
  likeCard: {
    borderColor: "#F7D6DE",
    backgroundColor: "#FCF6F8",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleGroup: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1D2E24" },
  placeBadge: {
    fontSize: 12,
    color: "#526259",
    marginTop: 2,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#FDF0F0",
  },
  deleteButtonText: { color: "#A12828", fontSize: 12, fontWeight: "600" },
  commentBody: { fontSize: 14, color: "#1D2E24", lineHeight: 20 },
  dateText: { fontSize: 12, color: "#8B9890" },
  voteRow: { flexDirection: "row", alignItems: "center" },
  likeTag: { fontSize: 14, fontWeight: "600", color: "#E0245E" },
  voteTag: {
    fontSize: 13,
    color: "#1D2E24",
    backgroundColor: "#EFF4F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  voteChoice: { fontWeight: "700", color: "#174B35" },
  reportReason: { fontSize: 14, color: "#1D2E24" },
  boldText: { fontWeight: "700" },
  reportDetails: {
    fontSize: 13,
    color: "#526259",
    fontStyle: "italic",
    backgroundColor: "#F9FAF9",
    padding: 8,
    borderRadius: 4,
  },
  statusBadge: {
    backgroundColor: "#FFF4E5",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: { color: "#B76E00", fontSize: 11, fontWeight: "600" },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D2E24",
    marginBottom: 6,
  },
  emptySubtitle: { fontSize: 14, color: "#526259", textAlign: "center" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, color: "#526259", fontSize: 14 },
  errorText: { color: "#A12828", padding: 12, textAlign: "center" },
});
