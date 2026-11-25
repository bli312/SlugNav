import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { getSupabase } from "@/lib/supabase";
import {
  deletePlacePhoto,
  getPlacePhotos,
  uploadPlacePhoto,
  type PlacePhoto,
} from "./photos";
import type { Place } from "./places";
import PhotoThumbnails from "./PhotoThumbnails";
import PhotoViewer from "./PhotoViewer";
import { preparePhoto } from "./preparePhoto";

type Props = {
  place: Place;
  userId?: string;
  // Called after a successful upload, e.g. to show the points pop-up.
  onPhotoAdded?: () => void;
};

// The Photos section of a place's details: view, add, and delete your photos.
export default function PlacePhotos({ place, userId, onPhotoAdded }: Props) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // The photo open full screen, as a position in `photos`; null when closed.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    getPlacePhotos(getSupabase(), place.id)
      .then((result) => {
        if (active) setPhotos(result);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [place.id]);

  async function addPhoto() {
    setActionError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
      });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      setUploading(true);
      const photo = await preparePhoto(asset.uri, asset.width);
      const saved = await uploadPlacePhoto(getSupabase(), place.id, photo);
      setPhotos((current) => [saved, ...current]);
      onPhotoAdded?.();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not add the photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photo: PlacePhoto) {
    setActionError(null);
    try {
      await deletePlacePhoto(getSupabase(), photo);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch {
      setActionError("Could not delete the photo.");
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Photos</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: uploading }}
          disabled={uploading}
          onPress={() => void addPhoto()}
          style={[styles.addButton, uploading && styles.addButtonBusy]}
        >
          <Text style={styles.addButtonText}>
            {uploading ? "Uploading…" : "Add photo"}
          </Text>
        </Pressable>
      </View>
      {actionError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError}
        </Text>
      )}
      {loading ? (
        <Text style={styles.message}>Loading photos…</Text>
      ) : loadError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Could not load photos.
        </Text>
      ) : photos.length === 0 ? (
        <Text style={styles.message}>
          No photos yet. Be the first to add one.
        </Text>
      ) : (
        <PhotoThumbnails
          photos={photos}
          placeName={place.name}
          userId={userId}
          onOpen={setOpenIndex}
          onDelete={(photo) => void removePhoto(photo)}
        />
      )}
      <PhotoViewer
        photos={photos}
        index={openIndex}
        placeName={place.name}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: 12, gap: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 16, fontWeight: "700", color: "#1D2E24" },
  addButton: {
    backgroundColor: "#174B35",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonBusy: { opacity: 0.6 },
  addButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  message: { color: "#526259" },
  error: { color: "#A12828" },
});
