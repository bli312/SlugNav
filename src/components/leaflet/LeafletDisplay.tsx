import React from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import LeafletMap from "./LeafletMap";

const map = new LeafletMap();
map.createMarker(36.99937065610728, -122.0616947376665, "CSE115A Classroom!");

export default function LeafletDisplay() {
  if (Platform.OS === "web") {
    return (
      <iframe
        title="UCSC campus map"
        sandbox="allow-scripts"
        srcDoc={map.leafletHTML}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    );
  }

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: map.leafletHTML }}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
