import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PlacePhoto } from "./photos";

type Props = {
  photos: PlacePhoto[];
  placeName: string;
  userId?: string;
  onOpen: (index: number) => void;
  onDelete: (photo: PlacePhoto) => void;
};

// A sideways-scrolling row of a place's photos. Tapping one opens it full
// screen; your own photos also get Delete.
export default function PhotoThumbnails({
  photos,
  placeName,
  userId,
  onOpen,
  onDelete,
}: Props) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.photos}>
      {photos.map((photo, index) => (
        <View key={photo.id} style={styles.photo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open photo ${index + 1} of ${photos.length}`}
            onPress={() => onOpen(index)}
          >
            <Image
              accessibilityLabel={`Photo of ${placeName}`}
              source={{ uri: photo.url }}
              style={styles.image}
            />
          </Pressable>
          {photo.userId === userId && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete your photo"
              onPress={() => onDelete(photo)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photos: { gap: 8 },
  photo: { gap: 4 },
  image: {
    width: 120,
    height: 120,
    borderRadius: 6,
    backgroundColor: "#E4E9E5",
  },
  deleteButton: { alignSelf: "flex-start" },
  deleteText: { color: "#A12828", fontSize: 13 },
});
