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

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const [markers, setMarkers] = useState<Marker[]>([]);
  const results = searchResults(classes, places, search, categories);

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
    <PlaceMap markers={markers} onPlaceAdded={addPlace}>
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
