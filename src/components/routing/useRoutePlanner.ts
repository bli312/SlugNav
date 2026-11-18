import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { getWalkingRoute, type WalkingRoute } from "../../lib/walkingRoute";
import type { Place } from "../places/places";
import { useUserLocation } from "../search/NearMe";

export default function useRoutePlanner(
  initialDestination: Place | null,
  onRouteChange: (route: WalkingRoute | null) => void,
) {
  const location = useUserLocation(true);
  const currentLocation =
    location.status === "found" ? location.location : null;
  const [from, setFrom] = useState<Place | "current">("current");
  const [destination, setDestination] = useState(initialDestination);
  const [editing, setEditing] = useState<"From" | "To" | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const active = useRef(true);
  const start = from === "current" ? currentLocation : from;
  const startLabel =
    from === "current" ? (start ? "Current location" : "") : from.name;

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      onRouteChange(null);
    };
  }, [onRouteChange]);

  function edit(field: "From" | "To") {
    setEditing(field);
    setQuery("");
  }

  function select(place: Place | "current") {
    if (editing === "From") setFrom(place);
    else if (place !== "current") setDestination(place);
    setEditing(null);
    setQuery("");
    setError(null);
    onRouteChange(null);
    Keyboard.dismiss();
  }

  async function request() {
    if (!start || !destination || pending.current) return;
    pending.current = true;
    setBusy(true);
    setEditing(null);
    setError(null);
    onRouteChange(null);
    try {
      const route = await getWalkingRoute(
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      );
      if (active.current) onRouteChange(route);
    } catch (failure) {
      if (active.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not get a walking route. Please try again.",
        );
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  return {
    startLabel,
    destination,
    currentLocation,
    editing,
    query,
    setQuery,
    busy,
    error,
    edit,
    select,
    request,
    canRequest: Boolean(start && destination) && !busy,
  };
}
