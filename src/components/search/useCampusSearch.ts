import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { getClasses } from "../classes/class_list/GetClasses";
import type { Class } from "../classes/class_list/types";
import { getPlaces, type Place } from "../places/places";

export default function useCampusSearch() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingAdditions = useRef<Place[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const addedDuringLoad: Place[] = [];
      pendingAdditions.current = addedDuringLoad;
      setLoading(true);
      setError(null);
      async function load() {
        try {
          const client = getSupabase();
          const [classRows, placeRows] = await Promise.all([
            getClasses(client),
            getPlaces(client),
          ]);
          if (active) {
            setClasses(classRows);
            setPlaces([
              ...addedDuringLoad,
              ...placeRows.filter(
                (place) =>
                  !addedDuringLoad.some((added) => added.id === place.id),
              ),
            ]);
          }
        } catch {
          if (active) setError("Could not load search results.");
        } finally {
          if (active) {
            pendingAdditions.current = null;
            setLoading(false);
          }
        }
      }
      void load();
      return () => {
        active = false;
        pendingAdditions.current = null;
      };
    }, []),
  );

  function addPlace(place: Place) {
    pendingAdditions.current?.push(place);
    setPlaces((current) => [
      place,
      ...current.filter((item) => item.id !== place.id),
    ]);
  }
  return { classes, places, loading, error, addPlace };
}
