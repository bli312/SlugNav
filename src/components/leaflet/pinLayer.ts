import type Marker from "./LeafletMarker.ts";
import { loadPopup } from "./LeafletPopup.ts";

// A pin the app sends to an already-loaded map. `popup` is escaped HTML.
export type Pin = { latitude: number; longitude: number; popup?: string };

// Runs inside the Leaflet page on both native and web. Swaps the "browse" pins
// and the "you are here" dot in place, so updates don't reload the map.
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
  let userDot;
  window.setUserLocation = (location, pan) => {
    if (userDot) userDot.remove();
    userDot = undefined;
    if (!location) return;
    const point = [location.latitude, location.longitude];
    userDot = L.circleMarker(point, {
      radius: 8, color: '#ffffff', weight: 3,
      fillColor: '#1a73e8', fillOpacity: 1
    }).bindTooltip('You are here').addTo(window.map);
    if (pan) window.map.panTo(point);
  };
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== window.origin) return;
    if (event.data?.type === 'set-pins') window.setPins(event.data.pins);
    if (event.data?.type === 'set-user-location') {
      window.setUserLocation(event.data.location, event.data.pan === true);
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
