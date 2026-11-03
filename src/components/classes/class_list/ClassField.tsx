import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

type Props = TextInputProps & { label: string };

export default function ClassField({ label, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: "#1D2E24", fontSize: 15, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    color: "#1D2E24",
    minHeight: 46,
    fontSize: 16,
  },
});
