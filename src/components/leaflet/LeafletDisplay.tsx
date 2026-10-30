import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Marker from "./LeafletMarker";
import LeafletMap from "./LeafletMap";

interface LeafletDisplayProps {
  markers: Array<Marker>;
}

export default function LeafletDisplay({ markers }: LeafletDisplayProps) {
  // recreate map html when searchbar used
  const mapHTML = useMemo(() => {
    const mapInstance = new LeafletMap();
    mapInstance.setMarkers(markers);
    return mapInstance.leafletHTML;
  }, [markers]);

  if (Platform.OS === "web") {
    return (
      <iframe
        title="UCSC campus map"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={mapHTML}
        style={{ flex: 1, width: "100%", height: "100%", border: 0 }}
      />
    );
  }

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: mapHTML }}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
