// Runs inside the Leaflet page on both native and web.
export const placePickerScript = `
  let pickingPlace = false;
  let pendingPin;
  window.setPlacePicking = (enabled) => {
    pickingPlace = enabled;
    window.map.invalidateSize({ pan: false });
    if (!enabled && pendingPin) {
      pendingPin.remove();
      pendingPin = undefined;
    }
  };
  // The srcdoc frame inherits the parent's origin, but its location.origin is "null".
  window.addEventListener('message', (event) => {
    if (event.source === window.parent && event.origin === window.origin
        && event.data?.type === 'place-picking') {
      window.setPlacePicking(event.data.enabled === true);
    }
  });
  window.map.on('click', (event) => {
    if (!pickingPlace) return;
    const point = event.latlng.wrap();
    if (pendingPin) pendingPin.setLatLng(point);
    else pendingPin = L.marker(point, { interactive: false }).addTo(window.map);
    const message = JSON.stringify({
      type: 'place-location', latitude: point.lat, longitude: point.lng
    });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else window.parent.postMessage(message, window.origin);
  });
`;
