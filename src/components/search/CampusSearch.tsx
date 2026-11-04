import React, { useState } from "react";
import { Keyboard, StyleSheet, Text, View } from "react-native";
import type Marker from "../leaflet/LeafletMarker";
import { createPopup } from "../leaflet/LeafletPopup";
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

const NO_PINS: Marker[] = [];

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const [markers, setMarkers] = useState<Marker[]>([]);
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
          }}
        />
        <SearchFilters
          selected={categories}
          onChange={(value) => {
            setCategories(value);
            setMarkers([]);
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
    </PlaceMap>
  );
}

const styles = StyleSheet.create({
  controls: { padding: 12, gap: 8 },
  message: { color: "#526259" },
  error: { color: "#A12828", paddingHorizontal: 12 },
});
