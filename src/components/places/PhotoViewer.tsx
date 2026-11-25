import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { PlacePhoto } from "./photos";

type Props = {
  photos: PlacePhoto[];
  // The open photo's position in `photos`, or null when the viewer is closed.
  index: number | null;
  placeName: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

// Shows one of a place's photos full screen, with Previous, Next, and Close.
export default function PhotoViewer({
  photos,
  index,
  placeName,
  onIndexChange,
  onClose,
}: Props) {
  const photo = index === null ? undefined : photos[index];
  if (index === null || !photo) return null;
  const position = `${index + 1} of ${photos.length}`;

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.screen}>
        <Image
          accessibilityLabel={`Photo ${position} of ${placeName}`}
          source={{ uri: photo.url }}
          resizeMode="contain"
          style={styles.image}
        />
        <Text style={styles.position}>{position}</Text>
        <View style={styles.controls}>
          <ViewerButton
            label="Previous"
            disabled={index === 0}
            onPress={() => onIndexChange(index - 1)}
          />
          <ViewerButton label="Close" onPress={onClose} />
          <ViewerButton
            label="Next"
            disabled={index === photos.length - 1}
            onPress={() => onIndexChange(index + 1)}
          />
        </View>
      </View>
    </Modal>
  );
}

function ViewerButton({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", padding: 12, gap: 12 },
  image: { flex: 1, width: "100%" },
  position: { color: "#FFFFFF", textAlign: "center", fontSize: 15 },
  controls: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#174B35",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
