import React from "react";
import { TextInput, StyleSheet } from "react-native";

interface SearchbarProps {
  search: string;
  onSearchChange: (text: string) => void;
}

export default function Searchbar({ search, onSearchChange }: SearchbarProps) {
  return (
    <TextInput
      style={styles.searchBar}
      placeholder="Search classrooms..."
      value={search}
      onChangeText={onSearchChange}
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
