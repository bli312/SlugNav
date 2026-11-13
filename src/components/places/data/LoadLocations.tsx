import { getSupabase } from "@/lib/supabase";
import Marker from "@/components/leaflet/LeafletMarker";
import { createPopup } from "@/components/leaflet/LeafletPopup";
import { useEffect, useState } from "react";

const PAGE_SIZE = 500;
export const NO_PINS: Marker[] = [];

export default function useCampusLocations() {
  const [markers, setMarkers] = useState<Marker[]>(NO_PINS);
  const [locationsLoading, setLocationsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const locations = await loadLocations();
        if (!isMounted) return;
        setMarkers(locations);
      } catch (error) {
        console.error("[ERROR] Failed to load campus class locations:", error);
        if (isMounted) {
          setMarkers([]);
        }
      } finally {
        if (isMounted) {
          console.log("[SUCCESS] Loaded campus class locations!");
          setLocationsLoading(false);
        }
      }
    };
    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, []);
  return { markers, setMarkers, locationsLoading };
}

export async function loadLocations(): Promise<Marker[]> {
  const client = getSupabase();
  const markers: Marker[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from("locations")
      .select(
        `
        name,
        pisa_name,
        building_name,
        building_latitude,
        building_longitude,
        room_name,
        room_longitude,
        room_latitude
      `,
      )
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    markers.push(...data.map(toMarker));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return markers;
}

type LocationRow = {
  name: string;
  pisa_name: string;
  building_name: string;
  building_latitude: number;
  building_longitude: number;
  room_name: string | null;
  room_longitude: number | null;
  room_latitude: number | null;
};

function toMarker(row: LocationRow): Marker {
  return {
    latitude: row.room_latitude ?? row.building_latitude,
    longitude: row.room_longitude ?? row.building_longitude,
    popup: createPopup(row.name, row.pisa_name, undefined),
    openPopup: false,
  };
}
