import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Place } from "../places/places";
import type { SearchResult } from "./searchResults";

interface FlatListSearchProps {
  results: SearchResult[];
  onSelect: (place: Place) => void;
  // Fill the available space instead of showing a short list.
  fullScreen?: boolean;
  // Optional button on the right of each place result, such as "Show on map".
  actionLabel?: string;
}

export default function FlatListSearch({
  results,
  onSelect,
  fullScreen = false,
  actionLabel,
}: FlatListSearchProps) {
  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.key}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable
            accessibilityRole={item.place ? "button" : undefined}
            disabled={!item.place}
            onPress={() => item.place && onSelect(item.place)}
            style={styles.item}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.detail}>{item.detail}</Text>
            {!item.place && (
              <Text style={styles.detail}>Map location unavailable</Text>
            )}
          </Pressable>
          {actionLabel && item.place && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${actionLabel}: ${item.title}`}
              onPress={() => item.place && onSelect(item.place)}
              style={styles.action}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.detail}>No matching results.</Text>
      }
      style={[
        styles.listContainer,
        fullScreen ? styles.fullScreen : styles.short,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: { paddingHorizontal: 12, backgroundColor: "#F6F8F5" },
  short: { maxHeight: 160, flexGrow: 0 },
  fullScreen: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
  },
  item: { flex: 1, paddingVertical: 8, gap: 2 },
  title: { fontSize: 15, fontWeight: "600", color: "#1D2E24" },
  detail: { fontSize: 14, color: "#526259" },
  action: {
    borderWidth: 1,
    borderColor: "#174B35",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionText: { color: "#174B35", fontSize: 13, fontWeight: "600" },
});
