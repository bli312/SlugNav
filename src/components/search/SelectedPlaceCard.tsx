import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { placeTypes, type Place } from "../places/places";

type Props = {
  place: Place;
  onFeedback: () => void;
};

export default function SelectedPlaceCard({ place, onFeedback }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.details}>
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.subtitle}>{placeTypes[place.type]}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Feedback & Votes for ${place.name}`}
        onPress={onFeedback}
        style={styles.feedbackButton}
      >
        <Text style={styles.feedbackButtonText}>Feedback & Votes</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D7DFD8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  details: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: "700", color: "#1D2E24" },
  subtitle: { fontSize: 13, color: "#526259", marginTop: 2 },
  feedbackButton: {
    backgroundColor: "#174B35",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  feedbackButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
