type Location = { latitude: number; longitude: number };

function isLocation(value: unknown): value is Location {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as Location;
  return (
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
  );
}

export async function handleWalkingRoute(
  request: Request,
  apiKey: string | undefined,
): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Use POST to request a route." },
      {
        status: 405,
        headers: { Allow: "POST" },
      },
    );
  }
  const input = await request.json().catch(() => null);
  if (!isLocation(input?.start) || !isLocation(input?.destination)) {
    return Response.json(
      { error: "Provide valid start and destination coordinates." },
      { status: 400 },
    );
  }
  if (!apiKey) {
    return Response.json(
      { error: "Walking routes are not configured yet." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinates: [
            [input.start.longitude, input.start.latitude],
            [input.destination.longitude, input.destination.latitude],
          ],
          preference: "recommended",
          instructions: false,
          units: "m",
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      if (data?.error?.code === 2009 || data?.error?.code === 2010) {
        return Response.json(
          { error: "No walking route was found between these locations." },
          { status: 404 },
        );
      }
      throw new Error("ORS request failed");
    }

    const feature = data?.features?.[0];
    const geometry = feature?.geometry;
    const summary = feature?.properties?.summary;
    if (
      geometry?.type !== "LineString" ||
      !Array.isArray(geometry.coordinates) ||
      geometry.coordinates.length < 2 ||
      !geometry.coordinates.every(
        (point: unknown) =>
          Array.isArray(point) &&
          point.length === 2 &&
          isLocation({ longitude: point[0], latitude: point[1] }),
      ) ||
      !Number.isFinite(summary?.distance) ||
      summary.distance < 0 ||
      !Number.isFinite(summary?.duration) ||
      summary.duration < 0
    ) {
      throw new Error("Invalid ORS response");
    }
    return Response.json({
      geometry,
      distanceMeters: summary.distance,
      durationSeconds: summary.duration,
      attribution:
        typeof data.metadata?.attribution === "string"
          ? data.metadata.attribution
          : "© openrouteservice by HeiGIT | © OpenStreetMap contributors",
    });
  } catch {
    return Response.json(
      { error: "Could not get a walking route. Please try again." },
      { status: 502 },
    );
  }
}
