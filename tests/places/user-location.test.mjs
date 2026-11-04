import assert from "node:assert/strict";
import { test } from "node:test";

import { findUserLocation } from "../../src/components/places/userLocation.ts";

// A fake location API; `calls` records whether the position was read.
const fakeApi = ({ granted = true, coords, failPermission, failPosition }) => {
  const calls = { position: 0 };
  return {
    calls,
    requestForegroundPermissionsAsync: async () => {
      if (failPermission) throw new Error("Synthetic permission failure");
      return { granted };
    },
    getCurrentPositionAsync: async () => {
      calls.position++;
      if (failPosition) throw new Error("Synthetic position failure");
      return { coords: { ...coords, accuracy: 5 } };
    },
  };
};

test("allowed permission returns only the latitude and longitude", async () => {
  const api = fakeApi({ coords: { latitude: 37, longitude: -122 } });
  assert.deepEqual(await findUserLocation(api), {
    status: "found",
    location: { latitude: 37, longitude: -122 },
  });
});

test("denied permission never reads the position", async () => {
  const api = fakeApi({ granted: false });
  assert.deepEqual(await findUserLocation(api), { status: "denied" });
  assert.equal(api.calls.position, 0);
});

test("a failure asking or reading the location reports an error", async () => {
  assert.deepEqual(await findUserLocation(fakeApi({ failPermission: true })), {
    status: "error",
  });
  assert.deepEqual(await findUserLocation(fakeApi({ failPosition: true })), {
    status: "error",
  });
});
