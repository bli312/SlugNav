import { useEffect, useState } from "react";
import * as Location from "expo-location";

import type { MapLocation } from "../leaflet/mapLocation";

export type UserLocation =
  | { status: "off" | "finding" | "denied" | "error" }
  | { status: "found"; location: MapLocation };

// Asks for location permission and reads the device's position once each time
// `enabled` turns on. The position stays on the device: it is only used to
// measure distances and is never saved or sent to Supabase.
export default function useUserLocation(enabled: boolean): UserLocation {
  const [state, setState] = useState<UserLocation>({ status: "off" });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "off" });
      return;
    }
    let active = true;
    setState({ status: "finding" });
    async function find() {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!granted) {
          setState({ status: "denied" });
          return;
        }
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) {
          setState({
            status: "found",
            location: {
              latitude: coords.latitude,
              longitude: coords.longitude,
            },
          });
        }
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void find();
    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
}
