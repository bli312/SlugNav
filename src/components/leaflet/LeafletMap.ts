import { loadPopup } from "./LeafletPopup";
import type Marker from "./LeafletMarker";
import { placePickerScript } from "./placePicker.ts";

export default class LeafletMap {
  STARTING_LOCATION = {
    latitude: 36.99937065610728,
    longitude: -122.0616947376665,
  };
  leafletHTML: string;
  private markers: Array<Marker> = new Array<Marker>();

  constructor() {
    this.leafletHTML = this.createHTML();
  }

  private createHTML(): string {
    const markerScripts = this.displayMarkers();
    const markersJSON = JSON.stringify(
      this.markers.map((m) => [m.latitude, m.longitude]),
    );
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            html, body, #map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            window.map = L.map("map")
              .setView(
                [${this.STARTING_LOCATION.latitude}, ${this.STARTING_LOCATION.longitude}],
                16
              );
            L.tileLayer(
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                maxZoom: 19,
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              }
            ).addTo(window.map);
            const markers = ${markersJSON}
            ${markerScripts}
            // fit bounds to do accurate zoom on average of markers
            if (markers.length > 0) {
              const bounds = L.latLngBounds(markers);
              window.map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 16
              });
            }
            ${placePickerScript}
          </script>
        </body>
      </html>
    `;
  }

  public setMarkers(markers: Array<Marker>): void {
    this.markers = markers;
    this.changeLocation(markers);
    this.leafletHTML = this.createHTML();
  }

  private changeLocation(markers: Array<Marker>): void {
    if (markers.length === 0) return;
    const total = markers.reduce(
      (acc, marker) => ({
        latitude: acc.latitude + marker.latitude,
        longitude: acc.longitude + marker.longitude,
      }),
      { latitude: 0, longitude: 0 },
    );
    this.STARTING_LOCATION = {
      latitude: total.latitude / markers.length,
      longitude: total.longitude / markers.length,
    };
  }

  private displayMarkers(): string {
    return this.markers
      .map((marker) => {
        let script = `L.marker([${marker.latitude}, ${marker.longitude}]).addTo(window.map)`;
        if (marker.popup) {
          script += `.bindPopup(${loadPopup(marker.popup)})`;
          if (marker.openPopup) script += ".openPopup()";
        }
        return script + ";";
      })
      .join("\n");
  }
}
