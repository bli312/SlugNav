import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import {
  mapCenterScript,
  readMapCenter,
} from "../../src/components/leaflet/mapCenter.ts";

for (const native of [true, false]) {
  test(`map reports its center on load and after moving on ${native ? "native" : "web"}`, () => {
    const sent = [];
    let moveEnd;
    let center = { lat: 37, lng: -122 };
    const target = {
      postMessage: (data, targetOrigin) => {
        if (!native) assert.equal(targetOrigin, "https://example.test");
        sent.push(JSON.parse(data));
      },
    };
    const window = {
      origin: "https://example.test",
      parent: target,
      ReactNativeWebView: native ? target : undefined,
      map: {
        getCenter: () => ({ wrap: () => center }),
        on: (type, callback) => {
          assert.equal(type, "moveend");
          moveEnd = callback;
        },
      },
    };
    runInNewContext(mapCenterScript, { window });
    assert.deepEqual(sent, [
      { type: "map-center", latitude: 37, longitude: -122 },
    ]);
    center = { lat: 37.001, lng: -122.002 };
    moveEnd();
    assert.deepEqual(sent.at(-1), {
      type: "map-center",
      latitude: 37.001,
      longitude: -122.002,
    });
  });
}

test("reads a valid map-center message", () => {
  assert.deepEqual(
    readMapCenter(
      JSON.stringify({ type: "map-center", latitude: 37, longitude: -122 }),
    ),
    { latitude: 37, longitude: -122 },
  );
});

test("ignores tap messages, broken text, and impossible coordinates", () => {
  const tap = { type: "place-location", latitude: 37, longitude: -122 };
  assert.equal(readMapCenter(JSON.stringify(tap)), null);
  assert.equal(readMapCenter("not json"), null);
  assert.equal(
    readMapCenter(
      JSON.stringify({ type: "map-center", latitude: 500, longitude: -122 }),
    ),
    null,
  );
});
