import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSupabase } from "@/lib/supabase";
import { deletePlacePhoto, getMyPhotos, type MyPhoto } from "./photos";
import PhotoViewer from "./PhotoViewer";

// Every photo the signed-in student has added, across all places.
export default function MyPhotosScreen() {
  const [photos, setPhotos] = useState<MyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getMyPhotos(getSupabase())
      .then((result) => {
        if (active) setPhotos(result);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your photos.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(photo: MyPhoto) {
    setDeleteError(false);
    try {
      await deletePlacePhoto(getSupabase(), photo);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch {
      setDeleteError(true);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#174B35" />
        <Text style={styles.message}>Loading your photos…</Text>
      </View>
    );
  }
  if (loadError) {
    return (
      <Text accessibilityRole="alert" style={styles.error}>
        {loadError}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {deleteError && (
        <Text accessibilityRole="alert" style={styles.error}>
          Could not delete the photo.
        </Text>
      )}
      <FlatList
        data={photos}
        keyExtractor={(photo) => String(photo.id)}
        renderItem={({ item, index }) => (
          <MyPhotoRow
            photo={item}
            label={`Open photo ${index + 1} of ${photos.length}`}
            onOpen={() => setOpenIndex(index)}
            onDelete={() => void remove(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.message}>
            You haven&apos;t added any photos yet.
          </Text>
        }
      />
      <PhotoViewer
        photos={photos}
        index={openIndex}
        placeName={openIndex === null ? "" : photos[openIndex]?.placeName}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </View>
  );
}

function MyPhotoRow({
  photo,
  label,
  onOpen,
  onDelete,
}: {
  photo: MyPhoto;
  label: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onOpen}
      >
        <Image source={{ uri: photo.url }} style={styles.thumbnail} />
      </Pressable>
      <View style={styles.details}>
        <Text style={styles.placeName}>{photo.placeName}</Text>
        <Text style={styles.message}>
          Added {formatAddedDate(photo.createdAt)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete photo of ${photo.placeName}`}
        onPress={onDelete}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </View>
  );
}

// For example "Nov 25, 2026", in the student's own time zone.
function formatAddedDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F5" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#E4E9E5",
  },
  details: { flex: 1, gap: 2 },
  placeName: { fontSize: 15, fontWeight: "600", color: "#1D2E24" },
  message: { color: "#526259", padding: 12 },
  error: { color: "#A12828", padding: 12 },
  deleteText: { color: "#A12828", fontSize: 13 },
});
