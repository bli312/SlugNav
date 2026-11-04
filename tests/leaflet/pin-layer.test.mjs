import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import {
  pinLayerScript,
  toPins,
} from "../../src/components/leaflet/pinLayer.ts";
import { createPopup } from "../../src/components/leaflet/LeafletPopup.ts";

// A tiny stand-in for Leaflet that records which pins, the "you are here"
// dot, and the map's pans.
function loadMap() {
  let onMessage;
  const layer = { pins: [] };
  layer.addTo = () => layer;
  layer.clearLayers = () => {
    layer.pins = [];
  };
  const map = { dots: [], pans: [] };
  // Copy the point: arrays made inside the vm sandbox fail strict deepEqual.
  map.panTo = (point) => map.pans.push([...point]);
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
    circleMarker: ([latitude, longitude]) => {
      const dot = { latitude, longitude };
      dot.bindTooltip = (tooltip) => {
        dot.tooltip = tooltip;
        return dot;
      };
      dot.addTo = (target) => {
        target.dots.push(dot);
        return dot;
      };
      dot.remove = () => {
        map.dots = map.dots.filter((item) => item !== dot);
      };
      return dot;
    },
  };
  const window = {
    origin: "https://example.test",
    parent: {},
    map,
    addEventListener: (_type, callback) => {
      onMessage = callback;
    },
  };
  runInNewContext(pinLayerScript, { window, L });
  return { window, layer, map, send: (event) => onMessage(event) };
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

test("one 'you are here' dot moves with the location and is removed with null", () => {
  const { window, map } = loadMap();
  window.setUserLocation({ latitude: 37, longitude: -122 }, true);
  window.setUserLocation({ latitude: 37.001, longitude: -122 }, true);
  assert.equal(map.dots.length, 1);
  assert.equal(map.dots[0].latitude, 37.001);
  assert.equal(map.dots[0].tooltip, "You are here");
  window.setUserLocation(null, true);
  assert.equal(map.dots.length, 0);
});

test("the map pans to the dot only when asked", () => {
  const { window, map } = loadMap();
  window.setUserLocation({ latitude: 37, longitude: -122 }, false);
  assert.deepEqual(map.pans, []);
  window.setUserLocation({ latitude: 37, longitude: -122 }, true);
  assert.deepEqual(map.pans, [[37, -122]]);
});

test("the dot can be set by a message from the app", () => {
  const { window, map, send } = loadMap();
  const data = {
    type: "set-user-location",
    location: { latitude: 37, longitude: -122 },
    pan: true,
  };
  send({ source: {}, origin: window.origin, data });
  assert.equal(map.dots.length, 0);
  send({ source: window.parent, origin: window.origin, data });
  assert.equal(map.dots.length, 1);
  assert.deepEqual(map.pans, [[37, -122]]);
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
