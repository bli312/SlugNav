import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { placeTypes } from "./places";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (type: string) => void;
};

export default function PlaceTypePicker({ value, disabled, onChange }: Props) {
  return (
    <View style={styles.options}>
      {Object.entries(placeTypes).map(([type, label]) => (
        <Pressable
          key={type}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === type, disabled }}
          disabled={disabled}
          onPress={() => onChange(type)}
          style={[styles.option, value === type && styles.selected]}
        >
          <Text style={{ color: value === type ? "#fff" : "#1D2E24" }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  selected: { backgroundColor: "#174B35" },
});
