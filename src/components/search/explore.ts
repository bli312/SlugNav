import type Marker from "../leaflet/LeafletMarker.ts";
import { createPopup } from "../leaflet/LeafletPopup.ts";
import { METERS_PER_FOOT } from "../places/nearby.ts";
import { placeTypes, type Place } from "../places/places.ts";
import type { SearchCategory } from "./searchResults.ts";

// Places whose type is turned on in the search filters.
export function placesInCategories(
  places: Array<Place>,
  categories: Array<SearchCategory>,
): Array<Place> {
  return places.filter((place) => categories.includes(place.type));
}

export function placeToMarker(place: Place): Marker {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    popup: createPopup(place.name, placeTypes[place.type], undefined),
  };
}

const METERS_PER_MILE = 1609.344;

// Feet under 1,000 ft (e.g. "180 ft"), miles above (e.g. "0.3 mi").
export function formatDistance(meters: number): string {
  const feet = meters / METERS_PER_FOOT;
  return feet < 1000
    ? `${Math.round(feet)} ft`
    : `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
}
