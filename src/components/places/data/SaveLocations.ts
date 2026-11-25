import type { SupabaseClient } from "@supabase/supabase-js";
import { Location } from "./Locations.ts";

export async function saveLocations(
  client: SupabaseClient,
  locations: Location[],
) {
  if (!locations.length) {
    throw new Error("No locations imported!");
  }
  const formattedLocations = locations.map((item) => ({
    name: item.name,
    pisa_name: item.pisaName,
    building_name: item.building?.name,
    building_latitude: item.building?.latitude,
    building_longitude: item.building?.longitude,
    room_name: item.room?.name,
    room_latitude: item.room?.latitude,
    room_longitude: item.room?.longitude,
  }));
  const { data, error } = await client.rpc("import_locations", {
    p_locations: formattedLocations,
  });
  return { formattedLocations, data, error };
}
