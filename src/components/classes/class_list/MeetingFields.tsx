import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ClassField from "./ClassField";
import WeekdayPicker from "./WeekdayPicker";
import type { MeetingDraft } from "./types.ts";

type Props = {
  meeting: MeetingDraft;
  meetingNumber: number;
  disabled: boolean;
  onChange: (changes: Partial<MeetingDraft>) => void;
};

export default function MeetingFields({
  meeting,
  meetingNumber,
  disabled,
  onChange,
}: Props) {
  return (
    <View style={styles.fields}>
      <WeekdayPicker
        days={meeting.days}
        meetingNumber={meetingNumber}
        disabled={disabled}
        onChange={(days) => onChange({ days })}
      />
      <View style={styles.times}>
        <View style={styles.timeField}>
          <ClassField
            label="Start time"
            accessibilityLabel={`Start time, meeting ${meetingNumber}`}
            value={meeting.startTime}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(startTime) => onChange({ startTime })}
          />
        </View>
        <View style={styles.timeField}>
          <ClassField
            label="End time"
            accessibilityLabel={`End time, meeting ${meetingNumber}`}
            value={meeting.endTime}
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(endTime) => onChange({ endTime })}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Use AM/PM (2:00 PM or 2pm) or 24-hour time (14:00). Times are Pacific.
      </Text>
      <ClassField
        label="Location"
        accessibilityLabel={`Location, meeting ${meetingNumber}`}
        value={meeting.location}
        editable={!disabled}
        onChangeText={(location) => onChange({ location })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  times: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1 },
  hint: { color: "#526259", fontSize: 14, lineHeight: 21 },
});
