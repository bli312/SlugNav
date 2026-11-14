import assert from "node:assert/strict";
import { mock, test } from "node:test";

mock.module("../../src/components/classes/pisa/parse/ParsePisaLocations.ts", {
  defaultExport: (locationStr) => {
    if (locationStr === "Building B") return { place: "Bldg B" };
    if (locationStr === "Building A") return { place: "Bldg A" };
    return { place: locationStr };
  },
});

const { default: sortByLocation, UNKNOWN } =
  await import("../../src/components/classes/pisa/SortByLocation.ts");

const mockClasses = [
  { id: 1, meetingInfo: { location: "Building B" } },
  { id: 2, meetingInfo: { location: "Building A" } },
  { id: 3, meetingInfo: { location: "Building B" } },
];

test("groups classes by parsed place and sorts them alphabetically", () => {
  const result = sortByLocation(mockClasses);
  assert.deepEqual(Object.keys(result), ["Bldg A", "Bldg B"]);
  assert.deepEqual(
    result["Bldg A"].map((course) => course.id),
    [2],
  );
  assert.deepEqual(
    result["Bldg B"].map((course) => course.id),
    [1, 3],
  );
});

test("groups empty or missing locations under the UNKNOWN constant", () => {
  const edgeCaseClasses = [
    { id: 4, meetingInfo: { location: "" } },
    { id: 5, meetingInfo: { location: null } },
  ];
  const result = sortByLocation(edgeCaseClasses);

  assert.deepEqual(
    result[UNKNOWN].map((course) => course.id),
    [4, 5],
  );
});
