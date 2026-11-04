import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { searchCategories, type SearchCategory } from "./searchResults";

type Props = {
  selected: SearchCategory[];
  onChange: (categories: SearchCategory[]) => void;
  // Extra buttons shown at the end of the same row, such as "Near me".
  children?: React.ReactNode;
};

export default function SearchFilters({ selected, onChange, children }: Props) {
  return (
    <View style={styles.filters}>
      {(Object.keys(searchCategories) as SearchCategory[]).map((category) => {
        const checked = selected.includes(category);
        return (
          <Pressable
            key={category}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() =>
              onChange(
                checked
                  ? selected.filter((item) => item !== category)
                  : [...selected, category],
              )
            }
            style={[styles.option, checked && styles.selected]}
          >
            <Text style={{ color: checked ? "#fff" : "#1D2E24" }}>
              {searchCategories[category]}
            </Text>
          </Pressable>
        );
      })}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  option: {
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  selected: { backgroundColor: "#174B35" },
});
