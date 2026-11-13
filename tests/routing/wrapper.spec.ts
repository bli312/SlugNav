import { beforeEach, expect, jest, test } from "@jest/globals";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { getSupabase } from "../../src/lib/supabase";
import { getWalkingRoute } from "../../src/lib/walkingRoute";

jest.mock("../../src/lib/supabase", () => ({
  getSupabase: () => ({ functions: { invoke: mockInvoke } }),
}));

const mockInvoke =
  jest.fn<ReturnType<typeof getSupabase>["functions"]["invoke"]>();
const start = { latitude: 37, longitude: -122 };
const destination = { latitude: 37.001, longitude: -122.002 };

beforeEach(() => mockInvoke.mockReset());

test("sends the start and destination to Supabase and returns the route", async () => {
  const route = {
    geometry: {
      type: "LineString",
      coordinates: [
        [-122, 37],
        [-122.002, 37.001],
      ],
    },
    distanceMeters: 250,
    durationSeconds: 180,
    attribution: "openrouteservice | OpenStreetMap contributors",
  };
  mockInvoke.mockResolvedValue({ data: route, error: null });
  await expect(getWalkingRoute(start, destination)).resolves.toEqual(route);
  expect(mockInvoke).toHaveBeenCalledWith("walking-route", {
    body: { start, destination },
  });
});

test("the wrapper reports function errors and connection failures to its caller", async () => {
  const noRoute = "No walking route was found between these locations.";
  for (const [error, message] of [
    [
      new FunctionsHttpError({ json: async () => ({ error: noRoute }) }),
      noRoute,
    ],
    [
      new FunctionsHttpError({
        json: async () => {
          throw new Error("not json");
        },
      }),
      "Could not get a walking route",
    ],
    [new Error("Network failure"), "Could not get a walking route"],
    [null, "Could not get a walking route"],
  ] as const) {
    mockInvoke.mockResolvedValue({ data: null, error });
    await expect(getWalkingRoute(start, destination)).rejects.toThrow(message);
  }
});
