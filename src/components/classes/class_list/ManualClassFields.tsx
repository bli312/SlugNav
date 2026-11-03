import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import ClassField from "./ClassField";
import MeetingFields from "./MeetingFields";
import { emptyMeeting } from "./manualClass";
import type { ManualClassDraft, MeetingDraft } from "./types.ts";

type Props = {
  draft: ManualClassDraft;
  disabled: boolean;
  onChange: (draft: ManualClassDraft) => void;
};

export default function ManualClassFields({
  draft,
  disabled,
  onChange,
}: Props) {
  function updateMeeting(index: number, changes: Partial<MeetingDraft>) {
    onChange({
      ...draft,
      meetings: draft.meetings.map((meeting, i) =>
        i === index ? { ...meeting, ...changes } : meeting,
      ),
    });
  }
  return (
    <>
      <ClassField
        label="Class name *"
        accessibilityLabel="Class name"
        value={draft.title}
        editable={!disabled}
        onChangeText={(title) => onChange({ ...draft, title })}
      />
      <ClassField
        label="Course code (optional)"
        accessibilityLabel="Course code"
        value={draft.courseCode}
        editable={!disabled}
        onChangeText={(courseCode) => onChange({ ...draft, courseCode })}
      />
      <ClassField
        label="Instructor (optional)"
        accessibilityLabel="Instructor"
        value={draft.instructor}
        editable={!disabled}
        onChangeText={(instructor) => onChange({ ...draft, instructor })}
      />
      <Text accessibilityRole="header" style={styles.heading}>
        Meeting details (optional)
      </Text>
      {draft.meetings.map((meeting, index) => (
        <View key={index} style={styles.meeting}>
          {draft.meetings.length > 1 && (
            <Text style={styles.label}>Meeting {index + 1}</Text>
          )}
          <MeetingFields
            meeting={meeting}
            meetingNumber={index + 1}
            disabled={disabled}
            onChange={(changes) => updateMeeting(index, changes)}
          />
          {draft.meetings.length > 1 && (
            <Button
              title="Remove meeting"
              color="#174B35"
              disabled={disabled}
              onPress={() =>
                onChange({
                  ...draft,
                  meetings: draft.meetings.filter((_, i) => i !== index),
                })
              }
            />
          )}
        </View>
      ))}
      <Button
        title="Add another meeting"
        color="#174B35"
        disabled={disabled}
        onPress={() =>
          onChange({ ...draft, meetings: [...draft.meetings, emptyMeeting()] })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: { color: "#1D2E24", fontSize: 17, fontWeight: "600", marginTop: 8 },
  label: { color: "#1D2E24", fontSize: 15, fontWeight: "500" },
  meeting: {
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
    paddingBottom: 20,
    gap: 12,
  },
});
