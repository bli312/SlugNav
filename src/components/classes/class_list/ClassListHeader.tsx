import React from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import type { ClassView } from "./types.ts";

type Props = {
  view: ClassView;
  onViewChange: (view: ClassView) => void;
  busy: boolean;
  onAddManual: () => void;
  error: string | null;
};

export default function ClassListHeader({
  view,
  onViewChange,
  busy,
  onAddManual,
  error,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.tabs}>
        {(["schedule", "catalog"] as const).map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === tab }}
            onPress={() => onViewChange(tab)}
            style={[styles.tab, view === tab && styles.activeTab]}
          >
            <Text style={[styles.label, view === tab && styles.activeLabel]}>
              {tab === "schedule" ? "My schedule" : "Browse classes"}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === "schedule" && (
        <Button
          title="Add a manual class"
          color="#174B35"
          disabled={busy}
          onPress={onAddManual}
        />
      )}
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 12, marginBottom: 12 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#174B35" },
  label: { fontSize: 15, color: "#526259" },
  activeLabel: { fontWeight: "600", color: "#174B35" },
  error: { color: "#A12828" },
});
