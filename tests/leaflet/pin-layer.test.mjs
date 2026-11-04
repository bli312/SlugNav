import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import {
  pinLayerScript,
  toPins,
} from "../../src/components/leaflet/pinLayer.ts";
import { createPopup } from "../../src/components/leaflet/LeafletPopup.ts";

// A tiny stand-in for Leaflet that records which pins are on the map.
function loadMap() {
  let onMessage;
  const layer = { pins: [] };
  layer.addTo = () => layer;
  layer.clearLayers = () => {
    layer.pins = [];
  };
  const L = {
    layerGroup: () => layer,
    marker: ([latitude, longitude]) => {
      const pin = { latitude, longitude };
      pin.bindPopup = (popup) => {
        pin.popup = popup;
        return pin;
      };
      pin.addTo = (group) => group.pins.push(pin);
      return pin;
    },
  };
  const window = {
    origin: "https://example.test",
    parent: {},
    map: {},
    addEventListener: (_type, callback) => {
      onMessage = callback;
    },
  };
  runInNewContext(pinLayerScript, { window, L });
  return { window, layer, send: (event) => onMessage(event) };
}

test("new pins replace the old ones instead of piling up", () => {
  const { window, layer } = loadMap();
  window.setPins([
    { latitude: 37, longitude: -122, popup: "<b>A</b>" },
    { latitude: 37.1, longitude: -122 },
  ]);
  window.setPins([{ latitude: 38, longitude: -121 }]);
  assert.equal(layer.pins.length, 1);
  assert.equal(layer.pins[0].latitude, 38);
});

test("a popup is added only when the pin has one", () => {
  const { window, layer } = loadMap();
  window.setPins([
    { latitude: 37, longitude: -122, popup: "<b>A</b>" },
    { latitude: 37.1, longitude: -122 },
  ]);
  assert.equal(layer.pins[0].popup, "<b>A</b>");
  assert.equal("popup" in layer.pins[1], false);
});

test("only accepts pin messages from the app", () => {
  const { window, layer, send } = loadMap();
  const data = { type: "set-pins", pins: [{ latitude: 37, longitude: -122 }] };
  send({ source: {}, origin: window.origin, data });
  send({ source: window.parent, origin: "https://evil.test", data });
  send({
    source: window.parent,
    origin: window.origin,
    data: { ...data, type: "other" },
  });
  assert.equal(layer.pins.length, 0);
  send({ source: window.parent, origin: window.origin, data });
  assert.equal(layer.pins.length, 1);
});

test("pins keep the place's location and escape its popup text", () => {
  const [pin, noPopup] = toPins([
    {
      latitude: 37,
      longitude: -122,
      popup: createPopup("<img src=x onerror=alert(1)>", "Bathroom", undefined),
    },
    { latitude: 38, longitude: -121 },
  ]);
  assert.equal(pin.latitude, 37);
  assert.equal(pin.longitude, -122);
  assert.match(pin.popup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(pin.popup, /<img/);
  assert.equal(noPopup.popup, undefined);
});
