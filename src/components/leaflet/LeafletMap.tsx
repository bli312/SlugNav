const CLASSROOM_LOCATION = {
  latitude: 36.99937065610728,
  longitude: -122.0616947376665,
};

export default class LeafletMap {
  leafletHTML: string;
  private markers: Array<{
    latitude: number;
    longitude: number;
    popup?: string;
  }> = new Array<{
    latitude: number;
    longitude: number;
    popup?: string;
  }>();

  constructor() {
    this.leafletHTML = this.createHTML();
  }
  private createHTML(): string {
    const markerScripts = this.markers
      .map((m) => {
        let script = `L.marker([${m.latitude}, ${m.longitude}]).addTo(window.map)`;
        if (m.popup) {
          script += `.bindPopup("${m.popup}")`;
        }
        return script + ";";
      })
      .join("\n");

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
              [${CLASSROOM_LOCATION.latitude}, ${CLASSROOM_LOCATION.longitude}],
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
    popupText?: string,
  ): void {
    this.markers.push({
      latitude: latitude,
      longitude: longitude,
      popup: popupText,
    });
    this.leafletHTML = this.createHTML();
  }
}
