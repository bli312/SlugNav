import React, { useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";

import LeafletDisplay from "@/components/leaflet/LeafletDisplay";
import Searchbar from "@/components/Searchbar";
import { Marker } from "@/components/leaflet/LeafletMap";
import { createPopup } from "@/components/leaflet/LeafletPopup";

// TODO replace testing data with ucsc api
const data: Array<Marker> = [
  {
    latitude: 36.99937065610728,
    longitude: -122.0616947376665,
    popup: createPopup(
      "CSE115A Classroom (Fall Quarter 2026)",
      "Physical Sciences Building - Room 114",
      "https://geohwilson.com/wp-content/uploads/2020/12/20201111ACCO315a-1-scaled.jpg",
    ),
  },
  {
    latitude: 36.99716392241645,
    longitude: -122.05169890254543,
    popup: createPopup(
      "CSE118 Classroom (Fall Quarter 2026)",
      "Stevenson Academics Building - Room 150",
      undefined,
    ),
  },
];

export default function CampusMap() {
  const { session, signOut, busy, error } = useAuth();
  const [search, setSearch] = useState("");
  const [filteredMarkers, setFilteredMarkers] = useState(data);

  // moved handlesearch from searchbar.tsx to index.tsx
  // this way, we can track when searchbar is updated
  // searchbar.tsx now used as "layout"
  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = data.filter((item) =>
      item.popup?.title.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredMarkers(filtered);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar (NavBar) */}
      <View style={styles.account}>
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.title}>
            SlugNav
          </Text>
          <Text numberOfLines={1}>{session?.user.email}</Text>
        </View>
        <Button
          title="Sign Out"
          disabled={busy}
          onPress={() => void signOut()}
        />
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Searchbar search={search} onSearchChange={handleSearch} />
      {/* FlatList */}
      {search.length > 0 && (
        <FlatList
          data={filteredMarkers}
          keyExtractor={(item) =>
            item.popup ? item.popup.title : "Unknown Classroom"
          }
          renderItem={({ item }) => (
            <Text style={styles.listItem}>{item.popup?.title}</Text>
          )}
          style={styles.listContainer}
        />
      )}
      {/* Leaflet Map */}
      <LeafletDisplay markers={filteredMarkers} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  account: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  identity: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: "700" },
  error: { color: "#A12828", paddingHorizontal: 16, paddingBottom: 12 },
  listContainer: {
    maxHeight: 120,
    paddingHorizontal: 16,
    backgroundColor: "#f9f9f9",
  },
  listItem: { paddingVertical: 6, fontSize: 14, color: "#333" },
});
