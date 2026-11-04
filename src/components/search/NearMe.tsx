import React from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import { NEARBY_RADIUS_METERS, type NearbyPlace } from "../places/nearby";
import { placeTypes, type Place } from "../places/places";
import type { UserLocation } from "../places/useUserLocation";
import { formatDistance } from "./explore";

// Styled like the search filter buttons, so it can sit in the same row.
export function NearMeToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={[styles.toggle, checked && styles.toggleOn]}
    >
      <Text style={{ color: checked ? "#fff" : "#1D2E24" }}>Near me</Text>
    </Pressable>
  );
}

const messages = {
  finding: "Finding your location…",
  denied:
    "Location is off for SlugNav. Turn it on to see places near you, or move the map to explore.",
  error: "Couldn't get your location. Turn Near me off and on to try again.",
};

// Places within NEARBY_RADIUS_METERS of the user, closest first.
export function NearMeList({
  userLocation,
  nearby,
  onSelect,
}: {
  userLocation: UserLocation;
  nearby: Array<NearbyPlace>;
  onSelect: (place: Place) => void;
}) {
  if (userLocation.status === "off") return null;
  if (userLocation.status !== "found") {
    return (
      <Text
        accessibilityRole={
          userLocation.status === "finding" ? undefined : "alert"
        }
        style={styles.message}
      >
        {messages[userLocation.status]}
      </Text>
    );
  }
  return (
    <FlatList
      data={nearby}
      keyExtractor={(place) => String(place.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <Text style={styles.heading}>
          Within {NEARBY_RADIUS_METERS} m of you
        </Text>
      }
      ListEmptyComponent={
        <Text style={styles.detail}>
          No places within {NEARBY_RADIUS_METERS} m of you.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelect(item)}
          style={styles.item}
        >
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.detail}>
            {placeTypes[item.type]} · {formatDistance(item.distanceMeters)}
          </Text>
        </Pressable>
      )}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    borderWidth: 1,
    borderColor: "#ABB7AE",
    borderRadius: 6,
    padding: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: "#174B35" },
  list: {
    maxHeight: 160,
    flexGrow: 0,
    paddingHorizontal: 12,
    backgroundColor: "#F6F8F5",
  },
  heading: { fontSize: 13, fontWeight: "600", color: "#526259", paddingTop: 6 },
  message: { color: "#526259", paddingHorizontal: 12, paddingBottom: 8 },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
    gap: 2,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#1D2E24" },
  detail: { fontSize: 14, color: "#526259" },
});
