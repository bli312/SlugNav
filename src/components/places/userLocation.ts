import type { MapLocation } from "../leaflet/mapLocation.ts";

export type UserLocation =
  | { status: "off" | "finding" | "denied" | "error" }
  | { status: "found"; location: MapLocation };

// The parts of expo-location this needs, passed in so tests can use a fake.
export type LocationApi = {
  requestForegroundPermissionsAsync: () => Promise<{ granted: boolean }>;
  getCurrentPositionAsync: () => Promise<{
    coords: { latitude: number; longitude: number };
  }>;
};

// Asks for permission, then reads the device's position once. The position
// stays on the device: it is only used to measure distances to places and is
// never saved or sent to Supabase.
export async function findUserLocation(
  api: LocationApi,
): Promise<UserLocation> {
  try {
    const { granted } = await api.requestForegroundPermissionsAsync();
    if (!granted) return { status: "denied" };
    const { coords } = await api.getCurrentPositionAsync();
    return {
      status: "found",
      location: { latitude: coords.latitude, longitude: coords.longitude },
    };
  } catch {
    return { status: "error" };
  }
}
