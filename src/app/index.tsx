import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          SlugNav
        </Text>
        <Text style={styles.subtitle}>Find your way around campus.</Text>
        <Text style={styles.description}>
          Your campus map and class schedule are coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F8F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    padding: 32,
    gap: 16,
  },
  title: {
    color: "#174B35",
    fontSize: 44,
    fontWeight: "700",
  },
  subtitle: {
    color: "#1D2E24",
    fontSize: 24,
    fontWeight: "600",
  },
  description: {
    color: "#526259",
    fontSize: 17,
    lineHeight: 26,
  },
});
