import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { placePickerScript } from "../../src/components/leaflet/placePicker.ts";

for (const native of [true, false]) {
  test(`map taps move one temporary pin and send coordinates on ${native ? "native" : "web"}`, () => {
    let click,
      message,
      point,
      removed = false,
      markerCount = 0;
    const sent = [];
    const parent = {
      postMessage: (data, targetOrigin) => {
        if (!native) assert.equal(targetOrigin, "https://example.test");
        sent.push(JSON.parse(data));
      },
    };
    const window = {
      origin: "https://example.test",
      location: { origin: "null" },
      parent,
      map: {
        invalidateSize: () => undefined,
        on: (_type, callback) => {
          click = callback;
        },
      },
      addEventListener: (_type, callback) => {
        message = callback;
      },
      ReactNativeWebView: native ? parent : undefined,
    };
    const marker = {
      addTo: () => marker,
      setLatLng: (value) => {
        point = value;
      },
      remove: () => {
        removed = true;
      },
    };
    const L = {
      marker: (value) => {
        point = value;
        markerCount++;
        return marker;
      },
    };
    runInNewContext(placePickerScript, { window, L });
    const tap = (lat) =>
      click({ latlng: { wrap: () => ({ lat, lng: -122 }) } });
    const enable = (source) =>
      message({
        source,
        origin: window.origin,
        data: { type: "place-picking", enabled: true },
      });
    enable({});
    tap(36);
    assert.equal(markerCount, 0);
    if (native) window.setPlacePicking(true);
    else enable(parent);
    tap(36);
    tap(37);
    assert.equal(markerCount, 1);
    assert.deepEqual(point, { lat: 37, lng: -122 });
    assert.deepEqual(sent.at(-1), {
      type: "place-location",
      latitude: 37,
      longitude: -122,
    });
    window.setPlacePicking(false);
    assert.equal(removed, true);
    tap(38);
    assert.equal(sent.length, 2);
  });
}
