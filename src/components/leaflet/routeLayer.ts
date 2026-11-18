// Runs inside the Leaflet page, using GeoJSON's [longitude, latitude] order.
export const routeLayerScript = `
  let walkingRoute;
  window.setWalkingRoute = (geometry) => {
    if (walkingRoute) walkingRoute.remove();
    walkingRoute = undefined;
    if (!geometry) return;
    walkingRoute = L.geoJSON(geometry, {
      attribution: '&copy; <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer">openrouteservice</a> by <a href="https://heigit.org/" target="_blank" rel="noopener noreferrer">HeiGIT</a>',
      style: { color: '#174B35', weight: 5 }
    }).addTo(window.map);
    const endpoints = [geometry.coordinates[0], geometry.coordinates[geometry.coordinates.length - 1]];
    endpoints.forEach(([longitude, latitude], index) => {
      L.circleMarker([latitude, longitude], {
        radius: 7, color: '#174B35', weight: 3,
        fillColor: index === 0 ? '#FFFFFF' : '#174B35', fillOpacity: 1
      }).bindTooltip(index === 0 ? 'Start' : 'End', {
        permanent: true, direction: 'top'
      }).addTo(walkingRoute);
    });
    window.map.closePopup();
    window.map.fitBounds(walkingRoute.getBounds(), { padding: [30, 30] });
  };
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== window.origin) return;
    if (event.data?.type === 'set-walking-route') {
      window.setWalkingRoute(event.data.geometry);
    }
  });
`;
