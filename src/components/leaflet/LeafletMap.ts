import { LeafletPopup } from "./LeafletPopup";

const STARTING_LOCATION = {
  latitude: 36.99937065610728,
  longitude: -122.0616947376665,
};

export default class LeafletMap {
  leafletHTML: string;
  private markers: Array<{
    latitude: number;
    longitude: number;
    popup?: LeafletPopup;
  }> = new Array<{
    latitude: number;
    longitude: number;
    popup?: LeafletPopup;
  }>();

  constructor() {
    this.leafletHTML = this.createHTML();
  }
  private createHTML(): string {
    const markerScripts = this.addMarkers();

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
            window.map = L.map("map").setView(
              [${STARTING_LOCATION.latitude}, ${STARTING_LOCATION.longitude}],
              18
            );
            L.tileLayer(
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                maxZoom: 19,
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              }
            ).addTo(window.map);
            ${markerScripts}
          </script>
        </body>
      </html>
    `;
  }
  public createMarker(
    latitude: number,
    longitude: number,
    popup?: LeafletPopup,
  ): void {
    this.markers.push({
      latitude: latitude,
      longitude: longitude,
      popup: popup,
    });
    this.leafletHTML = this.createHTML();
  }
  private addMarkers(): string {
    return this.markers
      .map((marker) => {
        let script = `L.marker([${marker.latitude}, ${marker.longitude}]).addTo(window.map)`;
        if (marker.popup) {
          script += `.bindPopup("${marker.popup.title}")`; // TODO expand on popup
        }
        return script + ";";
      })
      .join("\n");
  }
}
