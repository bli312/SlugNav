export type MapLocation = { latitude: number; longitude: number };

export function isMapLocation(value: unknown): value is MapLocation {
  if (!value || typeof value !== "object") return false;
  const { latitude, longitude } = value as MapLocation;
  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

// Reads a location message sent by the map page, such as a tapped spot
// ("place-location") or the map's center ("map-center").
export function readLocationMessage(
  data: string,
  type: string,
): MapLocation | null {
  try {
    const message = JSON.parse(data);
    if (message?.type === type && isMapLocation(message)) {
      return { latitude: message.latitude, longitude: message.longitude };
    }
  } catch {
    // Messages that aren't JSON are not map locations.
  }
  return null;
}

export function readMapLocation(data: string): MapLocation | null {
  return readLocationMessage(data, "place-location");
}
