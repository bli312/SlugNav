import assert from "node:assert/strict";
import { test } from "node:test";
import { handleWalkingRoute } from "../../supabase/functions/walking-route/handler.ts";

const start = { latitude: 37, longitude: -122 };
const destination = { latitude: 37.001, longitude: -122.002 };
const input = { start, destination };
const apiKey = "synthetic-ors-key";
const request = (body = input) =>
  new Request("https://example.test/walking-route", {
    method: "POST",
    body: JSON.stringify(body),
  });
const geometry = {
  type: "LineString",
  coordinates: [
    [-122, 37],
    [-122.002, 37.001],
  ],
};
const orsResult = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry,
      properties: { summary: { distance: 250, duration: 180 } },
    },
  ],
  metadata: { attribution: "openrouteservice | OpenStreetMap contributors" },
};

test("requests a walking route and returns its path, distance and duration", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(orsResult),
  );
  const response = await handleWalkingRoute(request(), apiKey);
  assert.equal(fetchMock.mock.calls.length, 1);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(
    url,
    "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson",
  );
  assert.equal(options.method, "POST");
  assert.equal(options.headers.Authorization, apiKey);
  assert.equal(options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(options.body), {
    coordinates: [
      [-122, 37],
      [-122.002, 37.001],
    ],
    preference: "recommended",
    instructions: false,
    units: "m",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    geometry,
    distanceMeters: 250,
    durationSeconds: 180,
    attribution: orsResult.metadata.attribution,
  });
});

test("rejects invalid requests before calling ORS", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(orsResult),
  );
  for (const body of [
    null,
    {},
    { start },
    { start: { latitude: "37", longitude: -122 }, destination },
    { start: { latitude: 91, longitude: 0 }, destination },
    { start, destination: { latitude: 0, longitude: -181 } },
  ]) {
    assert.equal(
      (await handleWalkingRoute(request(body), apiKey)).status,
      400,
      JSON.stringify(body),
    );
  }
  const malformed = new Request("https://example.test", {
    method: "POST",
    body: "not json",
  });
  assert.equal((await handleWalkingRoute(malformed, apiKey)).status, 400);
  assert.equal(
    (await handleWalkingRoute(new Request("https://example.test"), apiKey))
      .status,
    405,
  );
  assert.equal(fetchMock.mock.calls.length, 0);
});

test("reports missing ORS configuration without calling ORS", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(orsResult),
  );
  const response = await handleWalkingRoute(request(), undefined);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Walking routes are not configured yet.",
  });
  assert.equal(fetchMock.mock.calls.length, 0);
});

test("reports when ORS cannot find a route or a nearby routable point", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch");
  for (const code of [2009, 2010]) {
    fetchMock.mock.mockImplementation(async () =>
      Response.json(
        { error: { code, message: "Provider detail" } },
        { status: 404 },
      ),
    );
    const response = await handleWalkingRoute(request(), apiKey);
    assert.equal(response.status, 404, `ORS error ${code}`);
    assert.deepEqual(await response.json(), {
      error: "No walking route was found between these locations.",
    });
  }
});

for (const [name, fetchResult] of [
  [
    "ORS returns a server error",
    async () => Response.json({ error: { message: apiKey } }, { status: 503 }),
  ],
  [
    "ORS returns a quota error",
    async () => Response.json({ error: "Quota exceeded" }, { status: 429 }),
  ],
  [
    "ORS cannot be reached",
    async () => {
      throw new Error("Network failure");
    },
  ],
  ["ORS returns invalid JSON", async () => new Response("not json")],
  ["ORS returns no route data", async () => Response.json({ features: [] })],
  [
    "ORS returns invalid geometry",
    async () =>
      Response.json({
        ...orsResult,
        features: [{ geometry: { type: "Point" } }],
      }),
  ],
]) {
  test(`reports a routing failure when ${name}`, async (t) => {
    t.mock.method(globalThis, "fetch", fetchResult);
    const response = await handleWalkingRoute(request(), apiKey);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: "Could not get a walking route. Please try again.",
    });
  });
}

test("reports a routing failure when the ORS request times out", async (t) => {
  const signal = AbortSignal.abort(
    new DOMException("Timed out", "TimeoutError"),
  );
  const timeout = t.mock.method(AbortSignal, "timeout", () => signal);
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async (_url, options) => {
      options.signal?.throwIfAborted();
      return Response.json(orsResult);
    },
  );
  const response = await handleWalkingRoute(request(), apiKey);
  assert.equal(timeout.mock.calls[0].arguments[0], 10000);
  assert.equal(fetchMock.mock.calls[0].arguments[1].signal, signal);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Could not get a walking route. Please try again.",
  });
});
