import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import type { ClassView, Class } from "./types.ts";

type Props = {
  item: Class;
  view: ClassView;
  pendingId: string | null;
  onPress: () => void;
};

export default function ClassCard({ item, view, pendingId, onPress }: Props) {
  const removing = view === "schedule";
  const saved = !removing && item.saved;
  let label = removing ? "Remove" : "Save";
  if (pendingId === item.id) label = removing ? "Removing…" : "Saving…";
  if (saved) label = "Saved";

  return (
    <View style={styles.card}>
      {item.courseCode && (
        <Text style={styles.courseCode}>{item.courseCode}</Text>
      )}
      <Text style={styles.title}>{item.title}</Text>
      {item.instructor && <Text style={styles.detail}>{item.instructor}</Text>}
      {item.ownerId && (
        <Text style={styles.detail}>Manual class · Only you</Text>
      )}
      {item.meetings.length ? (
        item.meetings.map((meeting, index) => (
          <View key={index}>
            <Text style={styles.location}>
              {meeting.location ?? "Location TBA"}
            </Text>
            <Text style={styles.detail}>
              {[meeting.days, meeting.time].filter(Boolean).join(" · ") ||
                "Meeting time TBA"}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.detail}>Meeting details TBA</Text>
      )}
      {removing && item.ownerId && (
        <Text style={styles.detail}>
          Removing this class deletes its private details.
        </Text>
      )}
      <Button
        title={label}
        color="#174B35"
        disabled={saved || pendingId !== null}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  courseCode: { fontSize: 18, fontWeight: "600", color: "#1D2E24" },
  title: { fontSize: 15, marginTop: 2, color: "#1D2E24" },
  location: { fontSize: 15, marginTop: 8, fontWeight: "500", color: "#1D2E24" },
  detail: { fontSize: 14, marginTop: 2, color: "#526259" },
});
