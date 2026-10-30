import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";

import AccountHeader from "@/components/AccountHeader";
import Searchbar from "@/components/search/Searchbar";
import LeafletDisplay from "@/components/leaflet/LeafletDisplay";
import { Marker } from "@/components/leaflet/LeafletMap";
import { createPopup } from "@/components/leaflet/LeafletPopup";
import FlatListSearch from "@/components/search/FlatListSearch";

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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filteredMarkers, setFilteredMarkers] = useState(data);
  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar (NavBar) */}
      <AccountHeader
        userEmail={session?.user.email}
        busy={busy}
        onSignOut={() => void signOut()}
        onNavigateClasses={() => router.push("/classes")}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}

      {/* Searchbar */}
      <Searchbar
        search={search}
        markers={data}
        onSearchChange={setSearch}
        onFilteredMarkersChange={setFilteredMarkers}
      />
      <FlatListSearch search={search} filteredMarkers={filteredMarkers} />

      {/* Leaflet Map */}
      <LeafletDisplay markers={filteredMarkers} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { color: "#A12828", paddingHorizontal: 16, paddingBottom: 12 },
});
