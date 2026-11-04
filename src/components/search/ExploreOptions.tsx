import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { NEARBY_RADIUS_METERS, type NearbyPlace } from "../places/nearby";
import { placeTypes, type Place } from "../places/places";
import { formatDistance } from "./explore";

type Props = {
  showAll: boolean;
  onShowAllChange: (showAll: boolean) => void;
  showNearby: boolean;
  onShowNearbyChange: (showNearby: boolean) => void;
  // null until the map reports where it is centered.
  nearby: Array<NearbyPlace> | null;
  showNearbyList: boolean;
  onSelect: (place: Place) => void;
};

// "Show all on map" and "Nearby" toggles, plus the list of nearby places.
export default function ExploreOptions({
  showAll,
  onShowAllChange,
  showNearby,
  onShowNearbyChange,
  nearby,
  showNearbyList,
  onSelect,
}: Props) {
  return (
    <View>
      <View style={styles.toggles}>
        <Toggle
          label="Show all on map"
          checked={showAll}
          onChange={onShowAllChange}
        />
        <Toggle
          label="Nearby"
          checked={showNearby}
          onChange={onShowNearbyChange}
        />
      </View>
      {showNearby && showNearbyList && (
        <NearbyList nearby={nearby} onSelect={onSelect} />
      )}
    </View>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
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
      <Text style={{ color: checked ? "#fff" : "#1D2E24" }}>{label}</Text>
    </Pressable>
  );
}

function NearbyList({
  nearby,
  onSelect,
}: {
  nearby: Array<NearbyPlace> | null;
  onSelect: (place: Place) => void;
}) {
  if (!nearby) {
    return <Text style={styles.detail}>Finding the map center…</Text>;
  }
  return (
    <FlatList
      data={nearby}
      keyExtractor={(place) => String(place.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <Text style={styles.heading}>
          Within {NEARBY_RADIUS_METERS} m of the map center
        </Text>
      }
      ListEmptyComponent={
        <Text style={styles.detail}>
          No places within {NEARBY_RADIUS_METERS} m of the map center.
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
  toggles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
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
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DFD8",
    gap: 2,
  },
  title: { fontSize: 15, fontWeight: "600", color: "#1D2E24" },
  detail: { fontSize: 14, color: "#526259", paddingHorizontal: 12 },
});
