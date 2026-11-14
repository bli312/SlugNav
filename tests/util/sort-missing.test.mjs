import assert from "node:assert/strict";
import { test, mock } from "node:test";

mock.module("../../src/components/classes/pisa/parse/ParsePisaLocations.ts", {
  defaultExport: (locationStr) => {
    if (locationStr === "Building B") return { place: "Bldg B" };
    if (locationStr === "Building A") return { place: "Bldg A" };
    return { place: locationStr };
  },
});

mock.module("../../src/components/places/data/Locations.ts", {
  defaultExport: [
    { pisaName: "Alderman Library", building: "Alderman", room: "101" },
    { pisaName: "Monroe Hall", building: "Monroe", room: null },
  ],
});

const { default: sortMissingClasses, locationsWithRooms } =
  await import("../../src/components/classes/pisa/SortMissingClasses.ts");

const mockClasses = [
  { id: 1, meetingInfo: { location: "Alderman Library" } },
  { id: 2, meetingInfo: { location: "LEC" } },
  { id: 3, meetingInfo: { location: "Mystery Hall" } },
  { id: 4, meetingInfo: { location: "Monroe Hall" } },
];

test("sortMissingClasses categorizes found, ignored, and missing locations", () => {
  const result = sortMissingClasses(mockClasses);

  assert.ok(Object.hasOwn(result.found, "Alderman Library"));
  assert.ok(Object.hasOwn(result.found, "Monroe Hall"));
  assert.ok(Object.hasOwn(result.ignore, "LEC"));
  assert.ok(Object.hasOwn(result.missing, "Mystery Hall"));
});

test("locationsWithRooms counts locations with both building and room information", () => {
  assert.equal(locationsWithRooms(mockClasses), 1);
});

test("sortMissingClasses puts empty and TBD locations in the ignore category", () => {
  const edgeCaseClasses = [
    { id: 5, meetingInfo: { location: "" } },
    { id: 6, meetingInfo: { location: "TBD In Person" } },
  ];
  const result = sortMissingClasses(edgeCaseClasses);

  assert.ok(Object.hasOwn(result.ignore, ""));
  assert.ok(Object.hasOwn(result.ignore, "TBD In Person"));
});
