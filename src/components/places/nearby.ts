import type { MapLocation } from "../leaflet/mapLocation.ts";
import type { Place } from "./places.ts";

const EARTH_RADIUS_METERS = 6_371_000;

export const METERS_PER_FOOT = 0.3048;

// About a 4-minute walk. Distances are calculated in meters and shown in feet.
export const NEARBY_RADIUS_FEET = 1000;
export const NEARBY_RADIUS_METERS = NEARBY_RADIUS_FEET * METERS_PER_FOOT;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Straight-line ("as the crow flies") distance using the haversine formula.
// Walking distance comes later with routing (#39).
export function distanceMeters(from: MapLocation, to: MapLocation): number {
  const latitudeChange = toRadians(to.latitude - from.latitude);
  const longitudeChange = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeChange / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeChange / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export type NearbyPlace = Place & { distanceMeters: number };

// Places within radiusMeters of `from`, closest first.
export function nearbyPlaces(
  places: Array<Place>,
  from: MapLocation,
  radiusMeters: number,
): Array<NearbyPlace> {
  return places
    .map((place) => ({ ...place, distanceMeters: distanceMeters(from, place) }))
    .filter((place) => place.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
