import React, { useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
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
import { NearMeList, NearMeToggle, useUserLocation } from "./NearMe";
import { placeToMarker, placesInCategories } from "./explore";
import { NEARBY_RADIUS_METERS, nearbyPlaces } from "../places/nearby";
import useCampusLocations, { NO_PINS } from "../places/data/LoadLocations";

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const { markers, setMarkers } = useCampusLocations();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const results = searchResults(classes, places, search, categories);
  const [nearMe, setNearMe] = useState(false);
  const userLocation = useUserLocation(nearMe);
  // Every place of the selected types is pinned on the map. Memoized so the
  // pins are only resent when places or filters change.
  const shownPlaces = React.useMemo(
    () => placesInCategories(places, categories),
    [places, categories],
  );
  const pins = React.useMemo(
    () => shownPlaces.map(placeToMarker),
    [shownPlaces],
  );
  const nearby =
    userLocation.status === "found"
      ? nearbyPlaces(shownPlaces, userLocation.location, NEARBY_RADIUS_METERS)
      : [];

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
    <PlaceMap
      markers={markers}
      // A selected result takes over the map; otherwise show the filter pins.
      pins={markers.length > 0 ? NO_PINS : pins}
      userLocation={
        userLocation.status === "found" ? userLocation.location : null
      }
      onPlaceAdded={addPlace}
    >
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
        >
          <NearMeToggle checked={nearMe} onChange={setNearMe} />
        </SearchFilters>
      </View>
      {!search.trim() && !loading && !error && (
        <NearMeList
          userLocation={userLocation}
          nearby={nearby}
          onSelect={select}
        />
      )}
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
