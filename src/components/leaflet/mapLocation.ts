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

export function readMapLocation(data: string): MapLocation | null {
  try {
    const message = JSON.parse(data);
    if (message?.type === "place-location" && isMapLocation(message)) {
      return { latitude: message.latitude, longitude: message.longitude };
    }
  } catch {
    // Other WebView messages are not map selections.
  }
  return null;
}
