import React from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/providers/auth-provider";

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
  const { session, signOut, busy, error } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.account}>
        <View style={styles.identity}>
          <Text accessibilityRole="header" style={styles.title}>
            SlugNav
          </Text>
          <Text numberOfLines={1}>{session?.user.email}</Text>
        </View>
        <Button
          title="Sign out"
          disabled={busy}
          onPress={() => void signOut()}
        />
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {Platform.OS === "web" ? (
        <iframe
          title="UCSC campus map"
          sandbox="allow-scripts"
          srcDoc={leafletHTML}
          style={{ flex: 1, width: "100%", border: 0 }}
        />
      ) : (
        <WebView originWhitelist={["*"]} source={{ html: leafletHTML }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  account: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  identity: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: "700" },
  error: { color: "#A12828", paddingHorizontal: 16, paddingBottom: 12 },
});
