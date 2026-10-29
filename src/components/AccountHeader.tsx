import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

interface AccountHeaderProps {
  userEmail?: string;
  busy: boolean;
  onSignOut: () => void;
  onNavigateClasses: () => void;
}

export default function AccountHeader({
  userEmail,
  busy,
  onSignOut,
  onNavigateClasses,
}: AccountHeaderProps) {
  return (
    <View style={styles.account}>
      <View style={styles.identity}>
        <Text accessibilityRole="header" style={styles.title}>
          SlugNav
        </Text>
        <Text numberOfLines={1}>{userEmail}</Text>
      </View>
      <Button title="Classes" onPress={onNavigateClasses} />
      <Button title="Sign Out" disabled={busy} onPress={onSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
