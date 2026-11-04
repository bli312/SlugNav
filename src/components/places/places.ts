import type { SupabaseClient } from "@supabase/supabase-js";
import { isMapLocation, type MapLocation } from "../leaflet/mapLocation.ts";

export const placeTypes = {
  classroom: "Classroom",
  bathroom: "Bathroom",
  water_fountain: "Water fountain",
} as const;
export type PlaceType = keyof typeof placeTypes;
export type Place = MapLocation & { id: number; name: string; type: PlaceType };

export async function createPlace(
  client: SupabaseClient,
  name: string,
  type: string,
  location: MapLocation | null,
): Promise<Place> {
  if (!name.trim()) throw new Error("Enter a place name.");
  if (!Object.hasOwn(placeTypes, type)) throw new Error("Choose a place type.");
  if (!isMapLocation(location))
    throw new Error("Choose a location on the map.");
  const { data, error } = await client
    .from("places")
    .insert({
      name: name.trim(),
      type,
      latitude: location.latitude,
      longitude: location.longitude,
    })
    .select("id, name, type, latitude, longitude")
    .single();
  if (error) throw new Error("Could not save the place. Please try again.");
  return data as Place;
}
