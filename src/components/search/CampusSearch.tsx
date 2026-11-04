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
import ExploreOptions from "./ExploreOptions";
import { placeToMarker, placesInCategories } from "./explore";
import type { MapLocation } from "../leaflet/mapLocation";
import { NEARBY_RADIUS_METERS, nearbyPlaces } from "../places/nearby";

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const [markers, setMarkers] = useState<Marker[]>([]);
  const results = searchResults(classes, places, search, categories);
  const [showAll, setShowAll] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [center, setCenter] = useState<MapLocation | null>(null);
  // Memoized so the map only reloads when the browse pins actually change.
  const browseMarkers = React.useMemo(
    () => placesInCategories(places, categories).map(placeToMarker),
    [places, categories],
  );
  const nearby = center
    ? nearbyPlaces(
        placesInCategories(places, categories),
        center,
        NEARBY_RADIUS_METERS,
      )
    : null;

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
      // A selected result takes over the map; otherwise browse pins if on.
      markers={markers.length > 0 || !showAll ? markers : browseMarkers}
      onPlaceAdded={addPlace}
      onCenterChange={setCenter}
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
        />
      </View>
      <ExploreOptions
        showAll={showAll}
        onShowAllChange={(value) => {
          setShowAll(value);
          setMarkers([]);
        }}
        showNearby={showNearby}
        onShowNearbyChange={setShowNearby}
        nearby={nearby}
        showNearbyList={!search.trim() && !loading && !error}
        onSelect={select}
      />
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
