import React from "react";
import { StyleSheet, Text, View } from "react-native";
import SandwichBar from "./SandwichBar";

interface AccountHeaderProps {
  userEmail?: string;
  busy: boolean;
  onSignOut?: () => void;
  onNavigateClasses?: () => void;
  onNavigateFeedbackReports?: () => void;
  onNavigateLeaderboard?: () => void;
  onNavigateSettings?: () => void;
}

export default function AccountHeader({
  userEmail,
  busy,
  onSignOut,
  onNavigateClasses,
  onNavigateFeedbackReports,
  onNavigateLeaderboard,
  onNavigateSettings,
}: AccountHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <Text style={styles.title}>SlugNav</Text>
        <Text numberOfLines={1}>{userEmail}</Text>
      </View>
      <View style={styles.sandwich}>
        <SandwichBar
          busy={busy}
          onSignOut={onSignOut}
          onNavigateClasses={onNavigateClasses}
          onNavigateFeedbackReports={onNavigateFeedbackReports}
          onNavigateLeaderboard={onNavigateLeaderboard}
          onNavigateSettings={onNavigateSettings}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 1,
    padding: 16,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  sandwich: {
    alignItems: "center",
  },
});
