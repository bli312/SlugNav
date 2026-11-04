import React, { useEffect, useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LeafletDisplay from "../leaflet/LeafletDisplay";
import type Marker from "../leaflet/LeafletMarker";
import { createPopup } from "../leaflet/LeafletPopup";
import type { MapLocation } from "../leaflet/mapLocation";
import AddPlaceForm from "./AddPlaceForm";
import PlaceFeedbackModal from "./PlaceFeedbackModal";
import { placeTypes, type Place } from "./places";

type Props = {
  markers: Marker[];
  onPlaceAdded?: (place: Place) => void;
  children?: React.ReactNode;
};

export default function PlaceMap({ markers, onPlaceAdded, children }: Props) {
  const [adding, setAdding] = useState(false);
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [savedMarkers, setSavedMarkers] = useState<Marker[] | null>(null);
  const [savedPlace, setSavedPlace] = useState<Place | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  // Let the existing class search take over the map when its results change.
  useEffect(() => {
    setSavedMarkers(null);
    setSavedPlace(null);
    setLocation(null);
  }, [markers]);

  function finish(place?: Place) {
    setAdding(false);
    setLocation(null);
    if (place) {
      setSavedMarkers([
        {
          latitude: place.latitude,
          longitude: place.longitude,
          popup: createPopup(place.name, placeTypes[place.type], undefined),
        },
      ]);
      setSavedPlace(place);
      onPlaceAdded?.(place);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {!adding && children}
      <LeafletDisplay
        markers={savedMarkers ?? markers}
        onLocationSelect={adding ? setLocation : undefined}
      />
      {adding ? (
        <AddPlaceForm
          location={location}
          onSaved={finish}
          onCancel={() => finish()}
        />
      ) : (
        <>
          {savedMarkers && (
            <View style={styles.savedRow}>
              <Text style={styles.confirmation} accessibilityLiveRegion="polite">
                Place added.
              </Text>
              {savedPlace && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Feedback & Votes"
                  onPress={() => setFeedbackVisible(true)}
                  style={styles.savedFeedbackButton}
                >
                  <Text style={styles.savedFeedbackButtonText}>
                    Feedback & Votes
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <Button
            title="Add place"
            color="#174B35"
            onPress={() => setAdding(true)}
          />
        </>
      )}
      <PlaceFeedbackModal
        place={savedPlace}
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 8,
  },
  confirmation: { color: "#174B35", textAlign: "center" },
  savedFeedbackButton: {
    backgroundColor: "#174B35",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  savedFeedbackButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
