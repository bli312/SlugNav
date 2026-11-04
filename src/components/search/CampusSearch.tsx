import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import type Marker from "../leaflet/LeafletMarker";
import { createPopup } from "../leaflet/LeafletPopup";
import PlaceFeedbackModal from "../places/PlaceFeedbackModal";
import PlaceMap from "../places/PlaceMap";
import { placeTypes, type Place } from "../places/places";
import Searchbar from "./Searchbar";
import SearchFilters from "./SearchFilters";
import FlatListSearch from "./FlatListSearch";
import useCampusSearch from "./useCampusSearch";
import {
  searchCategories,
  searchResults,
  type SearchCategory,
} from "./searchResults";

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const results = searchResults(classes, places, search, categories);

  function select(place: Place) {
    Keyboard.dismiss();
    setSelectedPlace(place);
    setMarkers([
      {
        latitude: place.latitude,
        longitude: place.longitude,
        popup: createPopup(place.name, placeTypes[place.type], undefined),
        openPopup: true,
      },
    ]);
  }

  return (
    <PlaceMap markers={markers} onPlaceAdded={addPlace}>
      <View style={styles.controls}>
        <Searchbar
          search={search}
          placeholder="Search classes and places"
          onSearchChange={(value) => {
            setSearch(value);
            setMarkers([]);
            setSelectedPlace(null);
          }}
        />
        <SearchFilters
          selected={categories}
          onChange={(value) => {
            setCategories(value);
            setMarkers([]);
            setSelectedPlace(null);
          }}
        />
      </View>
      {Boolean(search.trim()) &&
        (loading ? (
          <Text style={styles.message}>Loading search results…</Text>
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : (
          <FlatListSearch results={results} onSelect={select} />
        ))}
      {selectedPlace && (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedDetails}>
            <Text style={styles.selectedTitle}>{selectedPlace.name}</Text>
            <Text style={styles.selectedSubtitle}>
              {placeTypes[selectedPlace.type]}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Feedback & Votes for ${selectedPlace.name}`}
            onPress={() => setFeedbackVisible(true)}
            style={styles.feedbackButton}
          >
            <Text style={styles.feedbackButtonText}>Feedback & Votes</Text>
          </Pressable>
        </View>
      )}
      <PlaceFeedbackModal
        place={selectedPlace}
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />
    </PlaceMap>
  );
}

const styles = StyleSheet.create({
  controls: { padding: 12, gap: 8 },
  message: { color: "#526259" },
  error: { color: "#A12828", paddingHorizontal: 12 },
  selectedContainer: {
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
  selectedDetails: { flex: 1, marginRight: 8 },
  selectedTitle: { fontSize: 15, fontWeight: "700", color: "#1D2E24" },
  selectedSubtitle: { fontSize: 13, color: "#526259", marginTop: 2 },
  feedbackButton: {
    backgroundColor: "#174B35",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  feedbackButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
