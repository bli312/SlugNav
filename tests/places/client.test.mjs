import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlace } from "../../src/components/places/places.ts";
import { readMapLocation } from "../../src/components/leaflet/mapLocation.ts";

const location = { latitude: 37, longitude: -122 };

test("creating a place sends only its editable fields and returns the saved record", async () => {
  let sent;
  const row = { id: 1, name: "Room", type: "classroom", ...location };
  const query = {
    insert: (value) => {
      sent = value;
      return query;
    },
    select: () => query,
    single: async () => ({ data: row, error: null }),
  };
  const client = {
    from: (table) => {
      assert.equal(table, "places");
      return query;
    },
  };
  assert.deepEqual(
    await createPlace(client, " Room ", "classroom", location),
    row,
  );
  assert.deepEqual(sent, { name: "Room", type: "classroom", ...location });
  query.single = async () => ({
    data: null,
    error: { message: "Internal detail" },
  });
  await assert.rejects(
    createPlace(client, "Room", "classroom", location),
    /Could not save the place/,
  );
});

test("invalid input fails before calling Supabase", async () => {
  const client = { from: () => assert.fail("Invalid input reached Supabase") };
  for (const [name, type, point, message] of [
    ["  ", "classroom", location, "Enter a place name."],
    ["Room", "", location, "Choose a place type."],
    ["Room", "__proto__", location, "Choose a place type."],
    ["Room", "classroom", null, "Choose a location on the map."],
    [
      "Room",
      "classroom",
      { latitude: NaN, longitude: -122 },
      "Choose a location on the map.",
    ],
  ])
    await assert.rejects(createPlace(client, name, type, point), { message });
});

test("map messages accept only valid selection coordinates", () => {
  assert.deepEqual(
    readMapLocation(JSON.stringify({ type: "place-location", ...location })),
    location,
  );
  for (const value of [
    "not json",
    "null",
    "{}",
    '{"type":"other"}',
    '{"type":"place-location","latitude":91,"longitude":0}',
  ]) {
    assert.equal(readMapLocation(value), null);
  }
});
