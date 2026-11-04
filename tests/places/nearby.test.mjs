import assert from "node:assert/strict";
import { test } from "node:test";

import {
  distanceMeters,
  nearbyPlaces,
} from "../../src/components/places/nearby.ts";

// Synthetic places near the center of campus; not real fixture locations.
const center = { latitude: 37.0, longitude: -122.06 };
const place = (id, latitude, longitude, type = "water_fountain") => ({
  id,
  name: `Test place ${id}`,
  type,
  latitude,
  longitude,
});
// 0.001 degrees of latitude is about 111 meters.
const near = place(1, 37.001, -122.06);
const nearer = place(2, 37.0005, -122.06, "bathroom");
const far = place(3, 37.01, -122.06);

test("distance from a point to itself is 0", () => {
  assert.equal(distanceMeters(center, center), 0);
});

test("distance from A to B is the same as B to A", () => {
  assert.equal(distanceMeters(center, far), distanceMeters(far, center));
});

test("distance matches a known value within a few meters", () => {
  // One degree of latitude is about 111,195 meters on a 6,371 km Earth.
  const oneDegreeNorth = { latitude: 38.0, longitude: -122.06 };
  assert.ok(Math.abs(distanceMeters(center, oneDegreeNorth) - 111_195) < 5);
  assert.ok(Math.abs(distanceMeters(center, near) - 111.2) < 5);
});

test("nearby places are sorted closest first", () => {
  const result = nearbyPlaces([far, near, nearer], center, 5_000);
  assert.deepEqual(
    result.map((item) => item.id),
    [nearer.id, near.id, far.id],
  );
});

test("only places within the radius are included, including one exactly on it", () => {
  const edge = distanceMeters(center, near);
  assert.deepEqual(
    nearbyPlaces([near, far], center, edge).map((item) => item.id),
    [near.id],
  );
  assert.deepEqual(nearbyPlaces([near], center, edge - 0.01), []);
});

test("an empty list or nothing in range returns an empty list", () => {
  assert.deepEqual(nearbyPlaces([], center, 500), []);
  assert.deepEqual(nearbyPlaces([far], center, 500), []);
});

test("results keep each place's details and add its distance", () => {
  const [result] = nearbyPlaces([nearer], center, 500);
  assert.equal(result.name, nearer.name);
  assert.equal(result.type, "bathroom");
  assert.ok(Math.abs(result.distanceMeters - 55.6) < 5);
});

test("does not change the list it was given", () => {
  const places = [far, near];
  nearbyPlaces(places, center, 5_000);
  assert.deepEqual(places, [far, near]);
  assert.equal("distanceMeters" in near, false);
});
