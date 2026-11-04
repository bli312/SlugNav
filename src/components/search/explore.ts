import type Marker from "../leaflet/LeafletMarker.ts";
import { createPopup } from "../leaflet/LeafletPopup.ts";
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

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
