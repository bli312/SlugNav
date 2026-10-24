import React, { useState } from "react";
import { View, Text, FlatList, TextInput, StyleSheet } from "react-native";

import { Marker } from "@/components/leaflet/LeafletMap";
import { createPopup } from "@/components/leaflet/LeafletPopup";

export default function Searchbar() {
  // TODO replace testing data with ucsc api
  const data: Array<Marker> = [
    {
      latitude: 36.99937065610728,
      longitude: -122.0616947376665,
      popup: createPopup(
        "CSE115A Classroom (Fall 2026 Quarter)",
        "Physical Sciences Building - Room 114",
        "https://geohwilson.com/wp-content/uploads/2020/12/20201111ACCO315a-1-scaled.jpg",
      ),
    },
    {
      latitude: 36.99716392241645,
      longitude: -122.05169890254543,
      popup: createPopup(
        "CSE118 Classroom (Fall 2026 Quarter)",
        "Stevenson Academics Building - Room 150",
        undefined,
      ),
    },
  ];
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = data.filter((item) =>
      item.popup?.title.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredData(filtered);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search here..."
        value={search}
        onChangeText={handleSearch}
      />
      {/* FlatList */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) =>
          item.popup ? item.popup.title : "Unknown Classroom"
        }
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.popup?.title}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  item: {
    fontSize: 18,
    padding: 10,
  },
});
