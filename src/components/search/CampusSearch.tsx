import React, { useState } from "react";
import { Keyboard, StyleSheet, Text, View, Button } from "react-native";
import { createPopup } from "../leaflet/LeafletPopup";
import PlaceFeedbackModal from "../places/PlaceFeedbackModal";
import PlaceMap from "../places/PlaceMap";
import { placeTypes, type Place } from "../places/places";
import Searchbar from "./Searchbar";
import SearchFilters from "./SearchFilters";
import FlatListSearch from "./FlatListSearch";
import SelectedPlaceCard from "./SelectedPlaceCard";
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
import RoutePlanner from "../routing/RoutePlanner";
import type { WalkingRoute } from "../../lib/walkingRoute";

export default function CampusSearch() {
  const { classes, places, loading, error, addPlace } = useCampusSearch();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>(
    Object.keys(searchCategories) as SearchCategory[],
  );
  const { markers, setMarkers } = useCampusLocations();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [routePlannerVisible, setRoutePlannerVisible] = useState(false);
  const [route, setRoute] = useState<WalkingRoute | null>(null);
  const results = searchResults(classes, places, search, categories);
  // While searching, results cover the screen; picking one returns to the map.
  const [resultsOpen, setResultsOpen] = useState(false);
  const showResults = resultsOpen && Boolean(search.trim());
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
    setResultsOpen(false);
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
      route={route?.geometry ?? null}
      mapHidden={showResults && !routePlannerVisible}
    >
      {routePlannerVisible ? (
        <RoutePlanner
          classes={classes}
          places={places}
          destination={selectedPlace}
          loading={loading}
          searchError={error}
          route={route}
          onRouteChange={setRoute}
          onClose={() => setRoutePlannerVisible(false)}
        />
      ) : (
        <>
          <View style={styles.controls}>
            <Searchbar
              search={search}
              placeholder="Search classes and places"
              onSearchChange={(value) => {
                setSearch(value);
                setResultsOpen(true);
                setMarkers([]);
                setSelectedPlace(null);
              }}
              onFocus={() => setResultsOpen(true)}
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
            <Button
              title="Get route"
              color="#174B35"
              onPress={() => setRoutePlannerVisible(true)}
            />
          </View>
          {!search.trim() && !loading && !error && (
            <NearMeList
              userLocation={userLocation}
              nearby={nearby}
              onSelect={select}
            />
          )}
          {showResults && (
            <View style={styles.results}>
              <View style={styles.resultsHeader}>
                <Text style={styles.message}>
                  {loading || error
                    ? "Search results"
                    : `${results.length} ${results.length === 1 ? "result" : "results"}`}
                </Text>
                <Button
                  title="Back to map"
                  color="#174B35"
                  onPress={() => {
                    Keyboard.dismiss();
                    setResultsOpen(false);
                  }}
                />
              </View>
              {loading ? (
                <Text style={styles.message}>Loading search results…</Text>
              ) : error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : (
                <FlatListSearch
                  results={results}
                  onSelect={select}
                  fullScreen
                  actionLabel="Show on map"
                />
              )}
            </View>
          )}
          {selectedPlace && (
            <SelectedPlaceCard
              place={selectedPlace}
              onFeedback={() => setFeedbackVisible(true)}
            />
          )}
        </>
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
  message: { color: "#526259", paddingHorizontal: 12 },
  error: { color: "#A12828", paddingHorizontal: 12 },
  results: { flex: 1 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
    paddingBottom: 8,
  },
});
