---
id: US-3.3-T-2
story: US-3.3
sprint: 3
assignee: Noah
estimate_hours: 3
---

# Display walking routes and time estimates on the map

## Description
Serves US-3.3 (find efficient walking routes with reliable time estimates). This task adds a From/To form for requesting a route and displays the route and estimated walking time on the existing map. Changes to the routing backend, linking classes to classrooms (US-3.5), turn-by-turn navigation, and departure notifications are out of scope.

## Specs
- A "Get route" button on the map opens a form with "From", "To", and "Get route" controls. "To" uses the currently selected result with a map location, if any; otherwise it starts empty.
- "From" defaults to "Current location". Opening the form requests foreground location access and reads the device's position once, using the existing `findUserLocation` helper in `src/components/places/userLocation.ts`.
- Both fields use the app's existing class-and-place search. A result can be chosen as an endpoint when it has a known map location. The "From" field also offers "Current location" so the user can switch back.
- If current location is unavailable, "From" has no default location. The user can select a starting point from search.
- On the map screen, "Get route" calls `getWalkingRoute(start, destination)` from `src/lib/walkingRoute.ts`. Each location is `{ latitude, longitude }`.
- "Get route" is disabled when either location is missing or a route request is in progress.
- A successful request draws the returned GeoJSON `geometry` on the existing map in `src/components/leaflet/LeafletDisplay.tsx`, with markers labeled "Start" and "End" at the route's endpoints.
- The map screen shows `durationSeconds` as an estimated walking time in minutes. For example, 180 seconds is shown as an estimate of 3 minutes.
- Provider credit links appear in the map's attribution corner alongside the existing OpenStreetMap credit while a route is displayed.
- A failed request displays the helper's error message and allows the user to try "Get route" again.

## Requirements
- Reuse the existing class-and-place search, routing helper, Leaflet map, and app styling. No new runtime dependencies.
- Keep endpoint selection within the From/To form; place cards and map pins do not need separate start/destination controls.
- Keep the ORS API key server-side. Do not save or log user coordinates or routes.
- Mock routing and device-location requests in UI tests; tests must not call live ORS or use the tester's real location.
- Existing search, place creation, and feedback tests must keep passing.

## Acceptance criteria
1. Opening "Get route" defaults the starting point to the device's current location when available; otherwise, "From" is unselected.
2. Both From/To fields support the existing class-and-place search and let the user select a result with a map location. The starting point can also be switched back to "Current location".
3. With a start and destination selected, pressing "Get route" displays the returned walking route with labeled start and end markers on the map when the request succeeds.
4. The displayed walking-time estimate matches the returned route's duration, expressed in minutes.
5. A route cannot be requested until both a start and a destination are available.
6. Repeated presses while a request is in progress do not start additional requests.
7. If a route request fails, the user sees an error message and can try again.
8. A displayed route includes its provider attribution.
