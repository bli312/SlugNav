import React from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import LeafletMap from "./LeafletMap";
import { createPopup } from "./LeafletPopup";

const map = new LeafletMap();

// TODO link classroom information to each marker with database
map.createMarker(
  36.99937065610728,
  -122.0616947376665,
  createPopup(
    "CSE115A Classroom (Fall 2026 Quarter)",
    "Physical Sciences Building - Room 114",
    "https://geohwilson.com/wp-content/uploads/2020/12/20201111ACCO315a-1-scaled.jpg",
  ),
);
map.createMarker(
  36.99716392241645,
  -122.05169890254543,
  createPopup(
    "CSE118 Classroom (Fall 2026 Quarter)",
    "Stevenson Academics Building - Room 150",
    undefined,
  ),
);
map.createMarker(
  36.994817863299645,
  -122.06576289755365,
  createPopup(undefined, undefined, undefined),
);

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
