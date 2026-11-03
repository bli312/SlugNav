import React from "react";
import { TextInput, StyleSheet } from "react-native";
import Marker from "../leaflet/LeafletMarker";

interface SearchbarProps {
  search: string;
  markers: Array<Marker>;
  onSearchChange: (text: string) => void;
  onFilteredMarkersChange: (markers: Array<Marker>) => void;
}

export default function Searchbar({
  search,
  markers,
  onSearchChange,
  onFilteredMarkersChange,
}: SearchbarProps) {
  // moved handlesearch from searchbar.tsx to index.tsx
  // this way, we can track when searchbar is updated
  // searchbar.tsx now used as "layout"
  const handleSearch = (text: string) => {
    onSearchChange(text);
    const filtered = markers.filter((item) =>
      item.popup?.title.toLowerCase().includes(text.toLowerCase()),
    );
    onFilteredMarkersChange(filtered);
  };
  return (
    <TextInput
      style={styles.searchBar}
      placeholder="Search classrooms..."
      value={search}
      onChangeText={handleSearch}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  item: {
    fontSize: 18,
    padding: 10,
  },
});
