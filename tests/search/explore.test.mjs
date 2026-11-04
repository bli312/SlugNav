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

test("distances show in feet under 1,000 ft and miles above", () => {
  // The input is meters: 1 ft = 0.3048 m and 1 mi = 1609.344 m.
  assert.equal(formatDistance(0), "0 ft");
  assert.equal(formatDistance(30.48), "100 ft");
  assert.equal(formatDistance(999 * 0.3048), "999 ft");
  assert.equal(formatDistance(1000 * 0.3048), "0.2 mi");
  assert.equal(formatDistance(1609.344), "1.0 mi");
  assert.equal(formatDistance(1.5 * 1609.344), "1.5 mi");
});
