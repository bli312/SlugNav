import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { runInNewContext } from "node:vm";
import { routeLayerScript } from "../../src/components/leaflet/routeLayer.ts";

const geometry = {
  type: "LineString",
  coordinates: [
    [-122, 37],
    [-122.001, 37.0005],
    [-122.002, 37.001],
  ],
};

function loadMap() {
  const map = { fitBounds: mock.fn(), closePopup: mock.fn() };
  const layer = {
    addTo: mock.fn(() => layer),
    getBounds: () => "route bounds",
    remove: mock.fn(),
  };
  const markers = [];
  const L = {
    geoJSON: mock.fn(() => layer),
    circleMarker: (point) => {
      const marker = {
        point: [...point],
        bindTooltip: mock.fn(() => marker),
        addTo: mock.fn(() => marker),
      };
      markers.push(marker);
      return marker;
    },
  };
  const window = {
    map,
    addEventListener() {},
  };
  runInNewContext(routeLayerScript, { window, L });
  return { window, map, layer, L, markers };
}

test("US-3.3-T-2 AC3: draws the route with labeled Start/End markers", () => {
  const { window, map, layer, L, markers } = loadMap();
  window.setWalkingRoute(geometry);
  assert.deepEqual(L.geoJSON.mock.calls[0].arguments[0], geometry);
  assert.equal(layer.addTo.mock.calls[0].arguments[0], map);
  assert.deepEqual(
    markers.map((marker) => marker.point),
    [
      [37, -122],
      [37.001, -122.002],
    ],
  );
  assert.deepEqual(
    markers.map((marker) => marker.bindTooltip.mock.calls[0].arguments[0]),
    ["Start", "End"],
  );
  for (const marker of markers) {
    assert.equal(marker.bindTooltip.mock.calls[0].arguments[1].permanent, true);
    assert.equal(marker.addTo.mock.calls[0].arguments[0], layer);
  }
});

test("US-3.3-T-2 AC8: includes linked provider credits on the route layer", () => {
  const { window, L } = loadMap();
  window.setWalkingRoute(geometry);
  const attribution = L.geoJSON.mock.calls[0].arguments[1].attribution;
  assert.match(
    attribution,
    /href="https:\/\/openrouteservice.org\/"[^>]*>openrouteservice<\/a>/,
  );
  assert.match(attribution, /href="https:\/\/heigit.org\/"[^>]*>HeiGIT<\/a>/);
});
