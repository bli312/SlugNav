import React, { useRef, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import ManualClassFields from "./ManualClassFields";
import { emptyManualClass } from "./manualClass";
import type { ManualClassDraft } from "./types.ts";

type Props = {
  onSave: (draft: ManualClassDraft) => Promise<void>;
  onCancel: () => void;
};

export default function ManualClassForm({ onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(emptyManualClass);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your class. Please try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.form}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.heading}>
          Add a manual class
        </Text>
        <Text style={styles.hint}>
          Only you can see it. Only the class name is required.
        </Text>
      </View>
      <ManualClassFields draft={draft} disabled={busy} onChange={setDraft} />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Button
        title={busy ? "Saving…" : "Save to my schedule"}
        color="#174B35"
        disabled={busy}
        onPress={() => void submit()}
      />
      <Button
        title="Cancel"
        color="#174B35"
        disabled={busy}
        onPress={onCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F8F5" },
  form: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  intro: { gap: 8 },
  heading: { color: "#1D2E24", fontSize: 22, fontWeight: "700" },
  hint: { color: "#526259", fontSize: 14, lineHeight: 21 },
  error: { color: "#A12828", fontSize: 15, lineHeight: 22 },
});
