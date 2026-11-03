import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlace } from "../../src/components/places/places.ts";
import { readMapLocation } from "../../src/components/leaflet/mapLocation.ts";
import { createClient } from "@supabase/supabase-js";
import { getPlaces } from "../../src/components/places/places.ts";

const location = { latitude: 37, longitude: -122 };

test("loading places reads every page and reports database failures", async () => {
  const records = Array.from({ length: 1001 }, (_, id) => ({
    id: id + 1,
    name: `Place ${id}`,
    type: "classroom",
    ...location,
  }));
  let fail = false;
  const client = createClient(
    "https://example.supabase.co",
    "sb_publishable_test",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: async (input) => {
          const url = new URL(input);
          assert.equal(url.pathname, "/rest/v1/places");
          assert.equal(
            url.searchParams.get("select"),
            "id,name,type,latitude,longitude",
          );
          assert.equal(url.searchParams.get("order"), "name.asc,id.asc");
          if (fail)
            return Response.json(
              { code: "42501", message: "Denied" },
              { status: 403 },
            );
          const offset = Number(url.searchParams.get("offset"));
          const limit = Number(url.searchParams.get("limit"));
          return Response.json(records.slice(offset, offset + limit));
        },
      },
    },
  );
  assert.deepEqual(await getPlaces(client), records);
  fail = true;
  await assert.rejects(getPlaces(client), { code: "42501" });
});

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
