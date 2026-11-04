import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

interface AccountHeaderProps {
  userEmail?: string;
  busy: boolean;
  onSignOut: () => void;
  onNavigateClasses: () => void;
  onNavigateFeedbackReports?: () => void;
}

export default function AccountHeader({
  userEmail,
  busy,
  onSignOut,
  onNavigateClasses,
  onNavigateFeedbackReports,
}: AccountHeaderProps) {
  return (
    <View style={styles.account}>
      <View style={styles.identity}>
        <Text accessibilityRole="header" style={styles.title}>
          SlugNav
        </Text>
        <Text numberOfLines={1}>{userEmail}</Text>
      </View>
      {onNavigateFeedbackReports && (
        <Button
          title="Feedback and Report"
          onPress={onNavigateFeedbackReports}
        />
      )}
      <Button title="Classes" onPress={onNavigateClasses} />
      <Button title="Sign Out" disabled={busy} onPress={onSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  account: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});
