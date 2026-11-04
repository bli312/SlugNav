import React, { useRef, useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { getSupabase } from "@/lib/supabase";
import type { MapLocation } from "../leaflet/mapLocation";
import { createPlace, type Place } from "./places";
import PlaceTypePicker from "./PlaceTypePicker";

type Props = {
  location: MapLocation | null;
  onSaved: (place: Place) => void;
  onCancel: () => void;
};

export default function AddPlaceForm({ location, onSaved, onCancel }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function save() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      onSaved(await createPlace(getSupabase(), name, type, location));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the place.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.noticeBubble}>
        <Text style={styles.noticeIcon}>ℹ️</Text>
        <Text style={styles.noticeText}>
          Creation is for all UCSC users.
        </Text>
      </View>

      <Text>
        {location
          ? "Location selected. Tap the map to move the pin."
          : "Tap the map to choose a location."}
      </Text>
      <TextInput
        accessibilityLabel="Place name"
        placeholder="Place name, e.g. Physical Sciences 114"
        style={styles.input}
        value={name}
        onChangeText={setName}
        editable={!busy}
      />
      <PlaceTypePicker value={type} disabled={busy} onChange={setType} />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <View style={styles.actions}>
        <Button
          title={busy ? "Saving…" : "Save place"}
          color="#174B35"
          disabled={busy}
          onPress={() => void save()}
        />
        <Button
          title="Cancel"
          color="#174B35"
          disabled={busy}
          onPress={onCancel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 12, gap: 8, backgroundColor: "#F6F8F5" },
  noticeBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0EA",
    borderWidth: 1,
    borderColor: "#B8D5C0",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    color: "#174B35",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    color: "#1D2E24",
  },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  error: { color: "#A12828" },
});
