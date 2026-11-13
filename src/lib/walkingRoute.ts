import { FunctionsHttpError } from "@supabase/supabase-js";
import type { MapLocation } from "../components/leaflet/mapLocation";
import { getSupabase } from "./supabase";

export type WalkingRoute = {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  distanceMeters: number;
  durationSeconds: number;
  attribution: string;
};

export async function getWalkingRoute(
  start: MapLocation,
  destination: MapLocation,
): Promise<WalkingRoute> {
  const { data, error } = await getSupabase().functions.invoke<WalkingRoute>(
    "walking-route",
    { body: { start, destination } },
  );
  if (error || !data) {
    let message = "Could not get a walking route. Please try again.";
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (typeof body?.error === "string") message = body.error;
    }
    throw new Error(message);
  }
  return data;
}
