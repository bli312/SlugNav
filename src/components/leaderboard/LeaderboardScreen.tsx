import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSupabase } from "@/lib/supabase";
import { useOptionalAuth } from "@/providers/auth-provider";
import {
  formatPoints,
  getLeaderboard,
  getUserRank,
  updateDisplayName,
  type LeaderboardEntry,
  type UserRankSummary,
} from "./leaderboard";

export default function LeaderboardScreen() {
  const auth = useOptionalAuth();
  const currentUserId = auth?.session?.user?.id;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRankSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Display name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = getSupabase();
      const [boardData, rankData] = await Promise.all([
        getLeaderboard(client),
        currentUserId
          ? getUserRank(client, currentUserId)
          : Promise.resolve(null),
      ]);
      setLeaderboard(boardData);
      setUserRank(rankData);
      if (rankData) {
        setNameInput(rankData.displayName);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load leaderboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSaveDisplayName() {
    if (!currentUserId) return;
    setNameError(null);
    setSavingName(true);
    try {
      const client = getSupabase();
      const updated = await updateDisplayName(client, currentUserId, nameInput);
      setUserRank((prev) => (prev ? { ...prev, displayName: updated } : null));
      setLeaderboard((prev) =>
        prev.map((entry) =>
          entry.userId === currentUserId
            ? { ...entry, displayName: updated }
            : entry,
        ),
      );
      setIsEditingName(false);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update display name.",
      );
    } finally {
      setSavingName(false);
    }
  }

  const renderRankBadge = (rank: number) => {
    if (rank === 1) return "🥇 #1";
    if (rank === 2) return "🥈 #2";
    if (rank === 3) return "🥉 #3";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          accessibilityLabel="Loading leaderboard"
          color="#174B35"
          size="large"
        />
        <Text style={styles.loadingText}>Loading campus contributors…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Privacy Notice Banner */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyBannerText}>
          🔒 Anonymous by default: Emails and schedules are never shared.
        </Text>
      </View>

      {/* Logged-in Student Standing Banner */}
      {currentUserId && userRank && (
        <View
          accessibilityLabel="Your leaderboard standing"
          style={styles.currentUserCard}
        >
          <View style={styles.userCardHeader}>
            <View style={styles.userCardInfo}>
              <Text style={styles.standingLabel}>YOUR STANDING</Text>
              <Text style={styles.userDisplayName}>{userRank.displayName}</Text>
            </View>
            <View style={styles.userRankPill}>
              <Text style={styles.userRankText}>
                {userRank.rank != null
                  ? renderRankBadge(userRank.rank)
                  : "Unranked"}
              </Text>
            </View>
          </View>

          <View style={styles.userStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatPoints(userRank.totalPoints)}
              </Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userRank.contributionsCount}
              </Text>
              <Text style={styles.statLabel}>Contributions</Text>
            </View>
          </View>

          {/* Edit Display Name Toggle / Form */}
          {isEditingName ? (
            <View style={styles.editNameSection}>
              <TextInput
                accessibilityLabel="Enter display name"
                maxLength={32}
                onChangeText={setNameInput}
                placeholder="Choose a display name"
                style={styles.nameInput}
                value={nameInput}
              />
              {nameError && (
                <Text accessibilityRole="alert" style={styles.nameErrorText}>
                  {nameError}
                </Text>
              )}
              <View style={styles.editButtonsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save display name"
                  disabled={savingName}
                  onPress={() => void handleSaveDisplayName()}
                  style={[styles.saveBtn, savingName && styles.btnDisabled]}
                >
                  <Text style={styles.saveBtnText}>
                    {savingName ? "Saving…" : "Save Name"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing display name"
                  disabled={savingName}
                  onPress={() => {
                    setNameInput(userRank.displayName);
                    setIsEditingName(false);
                    setNameError(null);
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change your display name"
              onPress={() => setIsEditingName(true)}
              style={styles.editNameButton}
            >
              <Text style={styles.editNameButtonText}>
                ✏️ Edit Display Name
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
          <Button title="Retry" onPress={() => void loadData()} />
        </View>
      )}

      {/* Top Contributors List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Contributors Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add campus places, photos, reviews, or votes to earn points and
                lead the board!
              </Text>
            </View>
          ) : undefined
        }
        ListHeaderComponent={
          leaderboard.length > 0 ? (
            <Text style={styles.sectionHeader}>Campus Rankings</Text>
          ) : undefined
        }
        renderItem={({ item }) => {
          const isCurrentUser = item.userId === currentUserId;
          return (
            <View
              accessibilityLabel={`Rank ${item.rank}: ${item.displayName}, ${item.totalPoints} points${
                isCurrentUser ? ", your account" : ""
              }`}
              style={[
                styles.entryCard,
                isCurrentUser && styles.currentUserEntryCard,
                item.rank === 1 && styles.firstPlaceCard,
              ]}
            >
              <View style={styles.rankBadgeContainer}>
                <Text
                  style={[
                    styles.rankBadgeText,
                    item.rank <= 3 && styles.topRankText,
                  ]}
                >
                  {renderRankBadge(item.rank)}
                </Text>
              </View>

              <View style={styles.entryDetails}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.entryName}>
                    {item.displayName}
                  </Text>
                  {isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryContributions}>
                  {item.contributionsCount}{" "}
                  {item.contributionsCount === 1
                    ? "contribution"
                    : "contributions"}
                </Text>
              </View>

              <View style={styles.entryPoints}>
                <Text style={styles.pointsText}>
                  {formatPoints(item.totalPoints)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F6F8F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#526259",
  },
  privacyBanner: {
    backgroundColor: "#EAF3ED",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D3E4D7",
  },
  privacyBannerText: {
    fontSize: 12,
    color: "#174B35",
    fontWeight: "500",
    textAlign: "center",
  },
  currentUserCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#174B35",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  userCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userCardInfo: {
    flex: 1,
    gap: 2,
  },
  standingLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#174B35",
    letterSpacing: 0.5,
  },
  userDisplayName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2E24",
  },
  userRankPill: {
    backgroundColor: "#174B35",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userRankText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  userStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#F6F8F5",
    borderRadius: 8,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D2E24",
  },
  statLabel: {
    fontSize: 11,
    color: "#526259",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#D7DFD8",
  },
  editNameButton: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editNameButtonText: {
    fontSize: 13,
    color: "#174B35",
    fontWeight: "600",
  },
  editNameSection: {
    gap: 8,
    marginTop: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#D7DFD8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
    color: "#1D2E24",
  },
  nameErrorText: {
    color: "#A12828",
    fontSize: 12,
  },
  editButtonsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  saveBtn: {
    backgroundColor: "#174B35",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: "#526259",
    fontSize: 13,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D2E24",
    marginTop: 8,
    marginBottom: 6,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7DFD8",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  firstPlaceCard: {
    borderColor: "#E5A823",
    backgroundColor: "#FFFCF4",
  },
  currentUserEntryCard: {
    borderColor: "#174B35",
    backgroundColor: "#F2F8F4",
    borderWidth: 1.5,
  },
  rankBadgeContainer: {
    minWidth: 48,
    alignItems: "center",
  },
  rankBadgeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#526259",
  },
  topRankText: {
    color: "#174B35",
  },
  entryDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D2E24",
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: "#174B35",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  youBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  entryContributions: {
    fontSize: 12,
    color: "#526259",
  },
  entryPoints: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#174B35",
  },
  emptyContainer: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D2E24",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#526259",
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#A12828",
    fontSize: 14,
    textAlign: "center",
  },
});
