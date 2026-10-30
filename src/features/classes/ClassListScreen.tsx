import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getClasses } from "./getClasses";
import { ucscClass } from "./mockClasses";

// Story 1.2: list classes with the building and room where each one meets.
export default function ClassListScreen() {
  const [classes, setClasses] = useState<ucscClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClasses()
      .then(setClasses)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Could not load classes.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={classes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.message}>No classes found.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.courseCode}>{item.courseCode}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.location}>
            {item.building ?? "Location TBA"}
            {item.room ? `, Room ${item.room}` : ""}
          </Text>
          {(item.days || item.time) && (
            <Text style={styles.detail}>
              {[item.days, item.time].filter(Boolean).join(" ")}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  list: { padding: 16, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  courseCode: { fontSize: 18, fontWeight: "600" },
  title: { fontSize: 15, marginTop: 2 },
  location: { fontSize: 15, marginTop: 8, fontWeight: "500" },
  detail: { fontSize: 14, marginTop: 2, color: "#555" },
  message: { fontSize: 15, color: "#555", textAlign: "center" },
});
