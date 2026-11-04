import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";

import AccountHeader from "@/components/AccountHeader";
import CampusSearch from "@/components/search/CampusSearch";

export default function CampusMap() {
  const { session, signOut, busy, error } = useAuth();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar (NavBar) */}
      <AccountHeader
        userEmail={session?.user.email}
        busy={busy}
        onSignOut={() => void signOut()}
        onNavigateClasses={() => router.push("/classes")}
        onNavigateFeedbackReports={() => router.push("/feedback-reports")}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      <CampusSearch />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: "#A12828", paddingHorizontal: 16, paddingBottom: 12 },
});
