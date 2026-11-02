import React, { useRef, useState } from "react";
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { emptyManualClass, emptyMeeting, weekdays } from "./manualClass";
import type { ManualClassDraft, MeetingDraft } from "./types.ts";

type Props = {
  onSave: (draft: ManualClassDraft) => Promise<void>;
  onCancel: () => void;
};

export default function ManualClassForm({ onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(emptyManualClass);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  function updateMeeting(index: number, changes: Partial<MeetingDraft>) {
    setDraft((current) => ({
      ...current,
      meetings: current.meetings.map((meeting, i) =>
        i === index ? { ...meeting, ...changes } : meeting,
      ),
    }));
  }

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
      <View style={styles.field}>
        <Text style={styles.label}>Class name *</Text>
        <TextInput
          accessibilityLabel="Class name"
          style={styles.input}
          value={draft.title}
          editable={!busy}
          onChangeText={(title) =>
            setDraft((current) => ({ ...current, title }))
          }
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Course code (optional)</Text>
        <TextInput
          accessibilityLabel="Course code"
          style={styles.input}
          value={draft.courseCode}
          editable={!busy}
          onChangeText={(courseCode) =>
            setDraft((current) => ({ ...current, courseCode }))
          }
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Instructor (optional)</Text>
        <TextInput
          accessibilityLabel="Instructor"
          style={styles.input}
          value={draft.instructor}
          editable={!busy}
          onChangeText={(instructor) =>
            setDraft((current) => ({ ...current, instructor }))
          }
        />
      </View>
      <Text accessibilityRole="header" style={styles.subheading}>
        Meeting details (optional)
      </Text>
      {draft.meetings.map((meeting, index) => (
        <View key={index} style={styles.meeting}>
          {draft.meetings.length > 1 && (
            <Text style={styles.label}>Meeting {index + 1}</Text>
          )}
          <View style={styles.field}>
            <Text style={styles.label}>Days</Text>
            <View style={styles.days}>
              {weekdays.map((day, i) => {
                const checked = meeting.days.includes(i + 1);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="checkbox"
                    disabled={busy}
                    accessibilityLabel={`${day}, meeting ${index + 1}`}
                    accessibilityState={{ checked, disabled: busy }}
                    style={({ pressed }) => [
                      styles.day,
                      checked && styles.dayChecked,
                      (pressed || busy) && styles.dimmed,
                    ]}
                    onPress={() =>
                      updateMeeting(index, {
                        days: checked
                          ? meeting.days.filter((value) => value !== i + 1)
                          : [...meeting.days, i + 1],
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        checked && styles.dayLabelChecked,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.times}>
            <View style={[styles.field, styles.timeField]}>
              <Text style={styles.label}>Start time</Text>
              <TextInput
                accessibilityLabel={`Start time, meeting ${index + 1}`}
                style={styles.input}
                value={meeting.startTime}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(startTime) =>
                  updateMeeting(index, { startTime })
                }
              />
            </View>
            <View style={[styles.field, styles.timeField]}>
              <Text style={styles.label}>End time</Text>
              <TextInput
                accessibilityLabel={`End time, meeting ${index + 1}`}
                style={styles.input}
                value={meeting.endTime}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(endTime) => updateMeeting(index, { endTime })}
              />
            </View>
          </View>
          <Text style={styles.hint}>
            Use AM/PM (2:00 PM or 2pm) or 24-hour time (14:00). Times are
            Pacific.
          </Text>
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              accessibilityLabel={`Location, meeting ${index + 1}`}
              style={styles.input}
              value={meeting.location}
              editable={!busy}
              onChangeText={(location) => updateMeeting(index, { location })}
            />
          </View>
          {draft.meetings.length > 1 && (
            <Button
              title="Remove meeting"
              color="#174B35"
              disabled={busy}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  meetings: current.meetings.filter((_, i) => i !== index),
                }))
              }
            />
          )}
        </View>
      ))}
      <Button
        title="Add another meeting"
        color="#174B35"
        disabled={busy}
        onPress={() =>
          setDraft((current) => ({
            ...current,
            meetings: [...current.meetings, emptyMeeting()],
          }))
        }
      />
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
  subheading: {
    color: "#1D2E24",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
  },
  label: { color: "#1D2E24", fontSize: 15, fontWeight: "500" },
  hint: { color: "#526259", fontSize: 14, lineHeight: 21 },
  field: { gap: 8 },
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
  meeting: {
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
    paddingBottom: 20,
    gap: 12,
  },
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
  dayChecked: { backgroundColor: "#174B35", borderColor: "#174B35" },
  dayLabel: { color: "#1D2E24", fontSize: 13, fontWeight: "600" },
  dayLabelChecked: { color: "#fff" },
  dimmed: { opacity: 0.55 },
  times: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1 },
  error: { color: "#A12828", fontSize: 15, lineHeight: 22 },
});
