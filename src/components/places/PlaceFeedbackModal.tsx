import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSupabase } from "@/lib/supabase";
import { useOptionalAuth } from "@/providers/auth-provider";
import {
  castVote,
  deleteComment,
  deleteVote,
  getPlaceFeedback,
  placeVoteDefinitions,
  postComment,
  reportReasons,
  submitReport,
  type PlaceFeedback,
  type ReportReason,
} from "./feedback";
import { placeTypes, type Place } from "./places";

interface PlaceFeedbackModalProps {
  place: Place | null;
  visible: boolean;
  onClose: () => void;
}

export default function PlaceFeedbackModal({
  place,
  visible,
  onClose,
}: PlaceFeedbackModalProps) {
  const auth = useOptionalAuth();
  const userId = auth?.session?.user?.id;

  const [feedback, setFeedback] = useState<PlaceFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("inaccurate");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!visible || !place) {
      setFeedback(null);
      setError(null);
      setShowReportForm(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getPlaceFeedback(getSupabase(), place.id, userId)
      .then((data) => {
        if (active) setFeedback(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load feedback.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [place, visible, userId]);

  if (!visible || !place) return null;

  const voteOptions = placeVoteDefinitions[place.type] || [];
  const isLiked = feedback?.votes["like"]?.userChoice === "liked";
  const likesCount = feedback?.votes["like"]?.counts["liked"] ?? 0;

  async function handleToggleLike() {
    if (!place) return;
    try {
      if (isLiked) {
        await deleteVote(getSupabase(), place.id, "like");
      } else {
        await castVote(getSupabase(), place.id, "like", "liked");
      }
      const updated = await getPlaceFeedback(getSupabase(), place.id, userId);
      setFeedback(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update like.");
    }
  }

  async function handleVote(optionKey: string, choiceValue: string) {
    if (!place) return;
    try {
      await castVote(getSupabase(), place.id, optionKey, choiceValue);
      // Refresh feedback to reflect updated counts
      const updated = await getPlaceFeedback(getSupabase(), place.id, userId);
      setFeedback(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed.");
    }
  }

  async function handleAddComment() {
    if (!place || !commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    setError(null);
    try {
      const newComment = await postComment(getSupabase(), place.id, commentText);
      setCommentText("");
      setFeedback((prev) =>
        prev
          ? { ...prev, comments: [newComment, ...prev.comments] }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comment failed.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await deleteComment(getSupabase(), commentId);
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleSubmitReport() {
    if (!place || submittingReport) return;
    setSubmittingReport(true);
    setError(null);
    try {
      await submitReport(getSupabase(), place.id, reportReason, reportDetails);
      setShowReportForm(false);
      setFeedback((prev) => (prev ? { ...prev, hasReported: true } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed.");
    } finally {
      setSubmittingReport(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{place.name}</Text>
              <Text style={styles.subtitle}>
                {placeTypes[place.type]} · Community Feedback
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close feedback modal"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {error && (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
          )}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#174B35" />
            </View>
          ) : (
            <ScrollView style={styles.scroll}>
              {/* Like this location */}
              <View style={styles.likeSection}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isLiked ? "Unlike this location" : "Like this location"
                  }
                  onPress={() => void handleToggleLike()}
                  style={[styles.likeButton, isLiked && styles.likeButtonLiked]}
                >
                  <Text style={styles.likeIcon}>{isLiked ? "❤️" : "🤍"}</Text>
                  <Text
                    style={[
                      styles.likeText,
                      isLiked && styles.likeTextLiked,
                    ]}
                  >
                    {isLiked ? "Liked" : "Like this location"} ({likesCount})
                  </Text>
                </Pressable>
              </View>

              {/* 1. Predefined Voting Options */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>🗳️ Feature Voting</Text>
                {voteOptions.map((opt) => {
                  const summary = feedback?.votes[opt.key];
                  return (
                    <View key={opt.key} style={styles.optionContainer}>
                      <Text style={styles.optionLabel}>{opt.label}</Text>
                      <View style={styles.choicesRow}>
                        {opt.choices.map((choice) => {
                          const count = summary?.counts[choice.value] ?? 0;
                          const isSelected = summary?.userChoice === choice.value;
                          return (
                            <Pressable
                              key={choice.value}
                              accessibilityRole="button"
                              accessibilityLabel={`${opt.label}: ${choice.label} (${count})`}
                              onPress={() => void handleVote(opt.key, choice.value)}
                              style={[
                                styles.choiceButton,
                                isSelected && styles.choiceButtonSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.choiceText,
                                  isSelected && styles.choiceTextSelected,
                                ]}
                              >
                                {choice.label} ({count})
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 2. Comments */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>💬 Student Comments</Text>
                <View style={styles.commentInputRow}>
                  <TextInput
                    accessibilityLabel="Write a comment"
                    placeholder="Share tips about this place..."
                    value={commentText}
                    onChangeText={setCommentText}
                    style={styles.commentInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Post comment"
                    disabled={!commentText.trim() || submittingComment}
                    onPress={() => void handleAddComment()}
                    style={[
                      styles.postButton,
                      (!commentText.trim() || submittingComment) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.postButtonText}>
                      {submittingComment ? "..." : "Post"}
                    </Text>
                  </Pressable>
                </View>

                {feedback?.comments.length ? (
                  feedback.comments.map((item) => (
                    <View key={item.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {item.userId === userId ? "You" : "UCSC Student"}
                        </Text>
                        {item.userId === userId && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete comment ${item.id}`}
                            onPress={() => void handleDeleteComment(item.id)}
                          >
                            <Text style={styles.deleteText}>Delete</Text>
                          </Pressable>
                        )}
                      </View>
                      <Text style={styles.commentContent}>{item.content}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No comments yet.</Text>
                )}
              </View>

              {/* 3. Reporting */}
              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                {feedback?.hasReported ? (
                  <Text style={styles.reportedNotice}>
                    ✓ You have reported this place for review.
                  </Text>
                ) : showReportForm ? (
                  <View style={styles.reportForm}>
                    <Text style={styles.sectionHeader}>⚠️ Report This Place</Text>
                    <Text style={styles.fieldLabel}>Select reason:</Text>
                    <View style={styles.reasonsList}>
                      {Object.entries(reportReasons).map(([rKey, rLabel]) => (
                        <Pressable
                          key={rKey}
                          accessibilityRole="radio"
                          accessibilityLabel={rLabel}
                          accessibilityState={{ checked: reportReason === rKey }}
                          onPress={() => setReportReason(rKey as ReportReason)}
                          style={[
                            styles.reasonOption,
                            reportReason === rKey && styles.reasonOptionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.reasonText,
                              reportReason === rKey && styles.reasonTextSelected,
                            ]}
                          >
                            {rLabel}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      accessibilityLabel="Report details"
                      placeholder="Additional details (optional)..."
                      value={reportDetails}
                      onChangeText={setReportDetails}
                      style={styles.detailsInput}
                    />
                    <View style={styles.reportActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Submit report"
                        disabled={submittingReport}
                        onPress={() => void handleSubmitReport()}
                        style={styles.submitReportButton}
                      >
                        <Text style={styles.submitReportText}>
                          {submittingReport ? "Submitting..." : "Submit Report"}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel report"
                        onPress={() => setShowReportForm(false)}
                        style={styles.cancelReportButton}
                      >
                        <Text style={styles.cancelReportText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Report an issue with this place"
                    onPress={() => setShowReportForm(true)}
                    style={styles.reportTrigger}
                  >
                    <Text style={styles.reportTriggerText}>
                      🚩 Report an issue with this place
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E4",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1D2E24" },
  subtitle: { fontSize: 13, color: "#526259", marginTop: 2 },
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "#F0F4F1",
    marginLeft: 12,
  },
  closeText: { fontSize: 16, color: "#1D2E24", fontWeight: "bold" },
  errorText: { color: "#A12828", padding: 12 },
  centered: { padding: 40, alignItems: "center" },
  scroll: { paddingHorizontal: 16 },
  likeSection: {
    paddingVertical: 12,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E4",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D7DFD8",
    backgroundColor: "#F6F8F5",
  },
  likeButtonLiked: {
    borderColor: "#E0245E",
    backgroundColor: "#FFF0F4",
  },
  likeIcon: { fontSize: 16 },
  likeText: { fontSize: 14, fontWeight: "600", color: "#1D2E24" },
  likeTextLiked: { color: "#E0245E" },
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E4",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#174B35",
    marginBottom: 10,
  },
  optionContainer: { marginBottom: 12 },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#1D2E24", marginBottom: 6 },
  choicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choiceButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ABB7AE",
    backgroundColor: "#F6F8F5",
  },
  choiceButtonSelected: {
    backgroundColor: "#174B35",
    borderColor: "#174B35",
  },
  choiceText: { fontSize: 13, color: "#1D2E24" },
  choiceTextSelected: { color: "#fff", fontWeight: "600" },
  commentInputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#F9FAF9",
  },
  postButton: {
    backgroundColor: "#174B35",
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.5 },
  postButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  commentCard: {
    backgroundColor: "#F6F8F5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: { fontSize: 12, fontWeight: "600", color: "#526259" },
  deleteText: { fontSize: 12, color: "#A12828" },
  commentContent: { fontSize: 14, color: "#1D2E24" },
  emptyText: { fontSize: 13, color: "#8B9890", fontStyle: "italic" },
  reportTrigger: { paddingVertical: 8, alignItems: "center" },
  reportTriggerText: { color: "#A12828", fontSize: 13, fontWeight: "500" },
  reportedNotice: { color: "#174B35", fontSize: 13, fontWeight: "500", textAlign: "center" },
  reportForm: { backgroundColor: "#FDF4F4", padding: 12, borderRadius: 8 },
  fieldLabel: { fontSize: 13, color: "#526259", marginBottom: 6 },
  reasonsList: { gap: 6, marginBottom: 8 },
  reasonOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#E0B6B6",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  reasonOptionSelected: {
    borderColor: "#A12828",
    backgroundColor: "#F9EAEA",
  },
  reasonText: { fontSize: 13, color: "#1D2E24" },
  reasonTextSelected: { color: "#A12828", fontWeight: "600" },
  detailsInput: {
    borderWidth: 1,
    borderColor: "#E0B6B6",
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  reportActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  submitReportButton: {
    backgroundColor: "#A12828",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  submitReportText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cancelReportButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelReportText: { color: "#526259", fontSize: 13 },
});
