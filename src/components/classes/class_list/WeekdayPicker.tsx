import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { weekdays } from "./manualClass";

type Props = {
  days: number[];
  meetingNumber: number;
  disabled: boolean;
  onChange: (days: number[]) => void;
};

export default function WeekdayPicker({
  days,
  meetingNumber,
  disabled,
  onChange,
}: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Days</Text>
      <View style={styles.days}>
        {weekdays.map((day, i) => {
          const checked = days.includes(i + 1);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              disabled={disabled}
              accessibilityLabel={`${day}, meeting ${meetingNumber}`}
              accessibilityState={{ checked, disabled }}
              style={({ pressed }) => [
                styles.day,
                checked && styles.checked,
                (pressed || disabled) && styles.dimmed,
              ]}
              onPress={() =>
                onChange(
                  checked
                    ? days.filter((value) => value !== i + 1)
                    : [...days, i + 1],
                )
              }
            >
              <Text style={[styles.dayLabel, checked && styles.checkedLabel]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: "#1D2E24", fontSize: 15, fontWeight: "500" },
  days: { flexDirection: "row", gap: 4 },
  day: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ABB7AE",
    backgroundColor: "#fff",
  },
  checked: { backgroundColor: "#174B35", borderColor: "#174B35" },
  dayLabel: { color: "#1D2E24", fontSize: 13, fontWeight: "600" },
  checkedLabel: { color: "#fff" },
  dimmed: { opacity: 0.55 },
});
