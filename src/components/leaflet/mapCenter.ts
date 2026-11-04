import { readLocationMessage, type MapLocation } from "./mapLocation.ts";

// Runs inside the Leaflet page on both native and web. Reports the map's
// center once it loads and after every pan or zoom, for "nearby" places.
export const mapCenterScript = `
  const reportCenter = () => {
    const center = window.map.getCenter().wrap();
    const message = JSON.stringify({
      type: 'map-center', latitude: center.lat, longitude: center.lng
    });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else window.parent.postMessage(message, window.origin);
  };
  window.map.on('moveend', reportCenter);
  reportCenter();
`;

export function readMapCenter(data: string): MapLocation | null {
  return readLocationMessage(data, "map-center");
}
