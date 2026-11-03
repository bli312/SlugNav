import React from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import type { Place } from "../places/places";
import type { SearchResult } from "./searchResults";

interface FlatListSearchProps {
  results: SearchResult[];
  onSelect: (place: Place) => void;
}

export default function FlatListSearch({
  results,
  onSelect,
}: FlatListSearchProps) {
  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.key}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
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
      )}
      ListEmptyComponent={
        <Text style={styles.detail}>No matching results.</Text>
      }
      style={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    maxHeight: 160,
    flexGrow: 0,
    paddingHorizontal: 12,
    backgroundColor: "#F6F8F5",
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
    gap: 2,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#1D2E24" },
  detail: { fontSize: 14, color: "#526259" },
});
