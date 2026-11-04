import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatDistance,
  placeToMarker,
  placesInCategories,
} from "../../src/components/search/explore.ts";

// Synthetic places; not real campus locations.
const room = {
  id: 1,
  name: "Sample Room",
  type: "classroom",
  latitude: 37,
  longitude: -122,
};
const fountain = {
  ...room,
  id: 2,
  name: "Sample Fountain",
  type: "water_fountain",
};

test("keeps only places whose type is selected", () => {
  assert.deepEqual(placesInCategories([room, fountain], ["water_fountain"]), [
    fountain,
  ]);
  assert.deepEqual(
    placesInCategories([room, fountain], ["classes", "classroom"]),
    [room],
  );
});

test("no selected types means no places", () => {
  assert.deepEqual(placesInCategories([room, fountain], []), []);
});

test("a place becomes a pin at its location with its name and type", () => {
  assert.deepEqual(placeToMarker(fountain), {
    latitude: 37,
    longitude: -122,
    popup: {
      title: "Sample Fountain",
      text: "Water fountain",
      image: undefined,
    },
  });
});

test("distances show in meters under 1 km and kilometers above", () => {
  assert.equal(formatDistance(120), "120 m");
  assert.equal(formatDistance(999), "999 m");
  assert.equal(formatDistance(1000), "1.0 km");
  assert.equal(formatDistance(1250), "1.3 km");
});
