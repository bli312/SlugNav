import type Marker from "./LeafletMarker.ts";
import { loadPopup } from "./LeafletPopup.ts";

// A pin the app sends to an already-loaded map. `popup` is escaped HTML.
export type Pin = { latitude: number; longitude: number; popup?: string };

// Runs inside the Leaflet page on both native and web. Swaps the "browse" pins
// in place, so changing filters doesn't reload the map or move the view.
export const pinLayerScript = `
  const pinLayer = L.layerGroup().addTo(window.map);
  window.setPins = (pins) => {
    pinLayer.clearLayers();
    for (const pin of pins) {
      const marker = L.marker([pin.latitude, pin.longitude]);
      if (pin.popup) marker.bindPopup(pin.popup);
      marker.addTo(pinLayer);
    }
  };
  window.addEventListener('message', (event) => {
    if (event.source === window.parent && event.origin === window.origin
        && event.data?.type === 'set-pins') {
      window.setPins(event.data.pins);
    }
  });
`;

export function toPins(markers: Array<Marker>): Array<Pin> {
  return markers.map((marker) => ({
    latitude: marker.latitude,
    longitude: marker.longitude,
    // loadPopup escapes user text and returns it as a JSON string literal.
    popup: marker.popup ? JSON.parse(loadPopup(marker.popup)) : undefined,
  }));
}
