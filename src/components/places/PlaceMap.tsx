import React, { useEffect, useState } from "react";
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
} from "react-native";
import LeafletDisplay from "../leaflet/LeafletDisplay";
import type Marker from "../leaflet/LeafletMarker";
import { createPopup } from "../leaflet/LeafletPopup";
import type { MapLocation } from "../leaflet/mapLocation";
import AddPlaceForm from "./AddPlaceForm";
import { placeTypes, type Place } from "./places";

export default function PlaceMap({ markers }: { markers: Marker[] }) {
  const [adding, setAdding] = useState(false);
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [savedMarkers, setSavedMarkers] = useState<Marker[] | null>(null);

  // Let the existing class search take over the map when its results change.
  useEffect(() => {
    setSavedMarkers(null);
    setLocation(null);
  }, [markers]);

  function finish(place?: Place) {
    setAdding(false);
    setLocation(null);
    if (place)
      setSavedMarkers([
        {
          latitude: place.latitude,
          longitude: place.longitude,
          popup: createPopup(place.name, placeTypes[place.type], undefined),
        },
      ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            <Text style={styles.confirmation} accessibilityLiveRegion="polite">
              Place added.
            </Text>
          )}
          <Button
            title="Add place"
            color="#174B35"
            onPress={() => setAdding(true)}
          />
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  confirmation: { padding: 8, color: "#174B35", textAlign: "center" },
});
