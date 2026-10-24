import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";
import LeafletDisplay from "@/components/leaflet/LeafletDisplay";
import Searchbar from "@/components/Searchbar";

export default function CampusMap() {
  const { session, signOut, busy, error } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar (NavBar) */}
      <View style={styles.account}>
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.title}>
            SlugNav
          </Text>
          <Text numberOfLines={1}>{session?.user.email}</Text>
        </View>
        <Button
          title="Sign out"
          disabled={busy}
          onPress={() => void signOut()}
        />
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      {/* Leaflet Map Display */}
      <LeafletDisplay />
      <Searchbar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  account: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  identity: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: "700" },
  error: { color: "#A12828", paddingHorizontal: 16, paddingBottom: 12 },
});
