import assert from "node:assert/strict";
import { test } from "node:test";
import { searchResults } from "../../src/components/search/searchResults.ts";

const classes = [
  {
    id: "1",
    courseCode: "TEST 101",
    title: "Field Studies",
    instructor: "Example Instructor",
    meetings: [{ location: "Sample Room", days: "Mon", time: "09:00–10:00" }],
  },
  {
    id: "2",
    courseCode: null,
    title: "My study group",
    instructor: null,
    meetings: [],
  },
];
const places = [
  {
    id: 1,
    name: "Sample Room",
    type: "classroom",
    latitude: 37,
    longitude: -122,
  },
  {
    id: 2,
    name: "Sample Restroom",
    type: "bathroom",
    latitude: 37.01,
    longitude: -122,
  },
  {
    id: 3,
    name: "Sample Fountain",
    type: "water_fountain",
    latitude: 37.02,
    longitude: -122,
  },
];

test("class search matches real codes, titles, instructors and locations without inventing coordinates", () => {
  for (const query of [" test 101 ", "FIELD", "instructor", "sample room"]) {
    const results = searchResults(classes, places, query, ["classes"]);
    assert.equal(results.length, 1);
    assert.equal(results[0].title, "TEST 101 · Field Studies");
    assert.match(results[0].detail, /Sample Room · Mon · 09:00–10:00/);
    assert.equal(results[0].place, undefined);
  }
  assert.equal(
    searchResults(classes, places, "study group", ["classes"])[0].detail,
    "Meeting details TBA",
  );
});

test("blank queries return nothing; text and multiple category filters work together", () => {
  for (const query of ["", "  "]) {
    assert.deepEqual(
      searchResults(classes, places, query, [
        "classes",
        "classroom",
        "bathroom",
        "water_fountain",
      ]),
      [],
    );
  }
  assert.deepEqual(
    searchResults(classes, places, "fountain", [
      "bathroom",
      "water_fountain",
    ]).map((item) => item.place),
    [places[2]],
  );
  assert.deepEqual(searchResults(classes, places, "sample", []), []);
  assert.deepEqual(
    searchResults(classes, places, "missing", ["classes", "classroom"]),
    [],
  );
  assert.deepEqual(
    searchResults(classes, places, "sample room", ["classes", "classroom"]).map(
      (item) => item.key,
    ),
    ["class:1", "place:1"],
  );
});
