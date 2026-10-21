import { Link } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const CLASSROOM_LOCATION = {
  latitude: 36.99937065610728,
  longitude: -122.0616947376665,
};

// TODO change from html script to ts
// makes it more manageable
const leafletHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map').setView([${CLASSROOM_LOCATION.latitude}, ${CLASSROOM_LOCATION.longitude}], 18);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    </script>
  </body>
  </html>
`;

// using openstreetmap as map info and leaflet as wrapper/display
// webview to cheat out a display
export default function App() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html: leafletHTML }} />
      <Link href="/classes" asChild>
        <Pressable style={[styles.classesButton, { top: insets.top + 12 }]}>
          <Text style={styles.classesButtonText}>Classes</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  classesButton: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#003c6c",
  },
  classesButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
