import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Marker from "./LeafletMarker";
import LeafletMap from "./LeafletMap";
import { readMapLocation, type MapLocation } from "./mapLocation";
import { toPins } from "./pinLayer";

interface LeafletDisplayProps {
  markers: Array<Marker>;
  // Pins swapped into the loaded map without reloading it (unlike `markers`).
  pins?: Array<Marker>;
  onLocationSelect?: (location: MapLocation) => void;
}

export default function LeafletDisplay({
  markers,
  pins,
  onLocationSelect,
}: LeafletDisplayProps) {
  const webView = useRef<WebView<object>>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const picking = Boolean(onLocationSelect);
  const receive = useCallback(
    (data: string) => {
      const location = readMapLocation(data);
      if (location) onLocationSelect?.(location);
    },
    [onLocationSelect],
  );
  const updatePicker = useCallback(() => {
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage(
        { type: "place-picking", enabled: picking },
        window.location.origin,
      );
    } else {
      webView.current?.injectJavaScript(
        `window.setPlacePicking?.(${picking}); true;`,
      );
    }
  }, [picking]);
  useEffect(updatePicker, [updatePicker]);
  const sendPins = useCallback(() => {
    if (!pins) return;
    const data = toPins(pins);
    if (Platform.OS === "web") {
      frame.current?.contentWindow?.postMessage(
        { type: "set-pins", pins: data },
        window.location.origin,
      );
    } else {
      webView.current?.injectJavaScript(
        `window.setPins?.(${JSON.stringify(data)}); true;`,
      );
    }
  }, [pins]);
  useEffect(sendPins, [sendPins]);
  // Messages sent before the page loads are lost, so resend on load.
  const syncMap = () => {
    updatePicker();
    sendPins();
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onMessage = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === window.location.origin &&
        typeof event.data === "string"
      )
        receive(event.data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [receive]);
  // recreate map html when searchbar used
  const mapHTML = useMemo(() => {
    const mapInstance = new LeafletMap();
    mapInstance.setMarkers(markers);
    return mapInstance.leafletHTML;
  }, [markers]);

  if (Platform.OS === "web") {
    return (
      <iframe
        ref={frame}
        onLoad={syncMap}
        title="UCSC Campus Map"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={mapHTML}
        style={{ flex: 1, width: "100%", height: "100%", border: 0 }}
      />
    );
  }

  return (
    <WebView
      ref={webView}
      onLoadEnd={syncMap}
      onMessage={(event) => receive(event.nativeEvent.data)}
      originWhitelist={["*"]}
      source={{ html: mapHTML }}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
