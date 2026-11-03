import React from "react";
import { FlatList, StyleSheet, Text } from "react-native";
import Marker from "../leaflet/LeafletMarker";

interface FlatListSearchProps {
  search: string;
  filteredMarkers: Array<Marker>;
}

export default function FlatListSearch({
  search,
  filteredMarkers,
}: FlatListSearchProps) {
  return (
    search.length > 0 && (
      <FlatList
        data={filteredMarkers}
        keyExtractor={(item) =>
          item.popup ? item.popup.title : "Unknown Classroom"
        }
        renderItem={({ item }) => (
          <Text style={styles.listItem}>{item.popup?.title}</Text>
        )}
        style={styles.listContainer}
      />
    )
  );
}

const styles = StyleSheet.create({
  listContainer: {
    maxHeight: 120,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
  },
  listItem: { paddingVertical: 6, fontSize: 14, color: "#333" },
});
