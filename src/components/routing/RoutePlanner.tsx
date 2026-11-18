import React from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import type { WalkingRoute } from "../../lib/walkingRoute";
import type { Class } from "../classes/class_list/types";
import type { Place } from "../places/places";
import FlatListSearch from "../search/FlatListSearch";
import Searchbar from "../search/Searchbar";
import {
  searchCategories,
  searchResults,
  type SearchCategory,
} from "../search/searchResults";
import useRoutePlanner from "./useRoutePlanner";

const categories = Object.keys(searchCategories) as SearchCategory[];

type Props = {
  classes: Class[];
  places: Place[];
  destination: Place | null;
  loading: boolean;
  searchError: string | null;
  route: WalkingRoute | null;
  onRouteChange: (route: WalkingRoute | null) => void;
  onClose: () => void;
};

export default function RoutePlanner({
  classes,
  places,
  destination,
  loading,
  searchError,
  route,
  onRouteChange,
  onClose,
}: Props) {
  const planner = useRoutePlanner(destination, onRouteChange);
  const results = searchResults(classes, places, planner.query, categories);
  const values = {
    From: planner.startLabel || "Choose starting point",
    To: planner.destination?.name || "Choose destination",
  };

  return (
    <View style={styles.container}>
      {(["From", "To"] as const).map((field) => (
        <Pressable
          key={field}
          accessibilityRole="button"
          accessibilityLabel={field}
          disabled={planner.busy}
          onPress={() => planner.edit(field)}
          style={styles.field}
        >
          <Text style={styles.label}>{field}</Text>
          <Text style={styles.text}>{values[field]}</Text>
        </Pressable>
      ))}
      {planner.editing && (
        <>
          <Searchbar
            search={planner.query}
            placeholder="Search classes and places"
            onSearchChange={planner.setQuery}
          />
          {planner.editing === "From" && (
            <Button
              title="Current location"
              color="#174B35"
              disabled={!planner.currentLocation}
              onPress={() => planner.select("current")}
            />
          )}
          {Boolean(planner.query.trim()) &&
            (loading ? (
              <Text>Loading search results…</Text>
            ) : searchError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {searchError}
              </Text>
            ) : (
              <FlatListSearch results={results} onSelect={planner.select} />
            ))}
        </>
      )}
      <View style={styles.buttons}>
        <Button title="Close route" color="#174B35" onPress={onClose} />
        <Button
          title="Get route"
          color="#174B35"
          disabled={!planner.canRequest}
          onPress={planner.request}
        />
      </View>
      {planner.busy && (
        <Text accessibilityLiveRegion="polite">Getting route…</Text>
      )}
      {planner.error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {planner.error}
        </Text>
      )}
      {route && (
        <Text style={styles.label} accessibilityLiveRegion="polite">
          Estimated walk: {Math.ceil(route.durationSeconds / 60)} min
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 8 },
  field: {
    minHeight: 44,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  label: { fontWeight: "600", color: "#1D2E24" },
  text: { color: "#1D2E24" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  error: { color: "#A12828" },
});
