import React from "react";
import { TextInput, StyleSheet } from "react-native";

interface SearchbarProps {
  search: string;
  placeholder: string;
  onSearchChange: (text: string) => void;
}

export default function Searchbar({
  search,
  placeholder,
  onSearchChange,
}: SearchbarProps) {
  return (
    <TextInput
      style={styles.searchBar}
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      value={search}
      onChangeText={onSearchChange}
    />
  );
}

const styles = StyleSheet.create({
  searchBar: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#ABB7AE",
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#1D2E24",
  },
});
