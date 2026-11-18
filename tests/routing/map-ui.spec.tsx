import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { WebViewProps } from "react-native-webview";
import * as Location from "expo-location";
import CampusSearch from "../../src/components/search/CampusSearch";
import * as placesApi from "../../src/components/places/places";
import { getClasses } from "../../src/components/classes/class_list/GetClasses";
import { getWalkingRoute, type WalkingRoute } from "../../src/lib/walkingRoute";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual<typeof import("react")>("react");
  return {
    useFocusEffect: (effect: React.EffectCallback) =>
      useEffect(effect, [effect]),
  };
});
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/classes/class_list/GetClasses");
jest.mock("../../src/lib/walkingRoute");
jest.mock("../../src/components/places/places", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/places")>(
    "../../src/components/places/places",
  ),
  getPlaces: jest.fn(),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
const mockInjected: string[] = [];
jest.mock("react-native-webview", () => {
  const { forwardRef, useImperativeHandle } =
    jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: forwardRef((props: WebViewProps, ref) => {
      useImperativeHandle(ref, () => ({
        injectJavaScript: (script: string) => mockInjected.push(script),
      }));
      return <View testID="map" {...props} />;
    }),
  };
});

const currentLocation = { latitude: 37, longitude: -122 };
const room: placesApi.Place = {
  id: 1,
  name: "Sample Room",
  type: "classroom",
  latitude: 37.001,
  longitude: -122.002,
};
const fountain: placesApi.Place = {
  id: 2,
  name: "Sample Fountain",
  type: "water_fountain",
  latitude: 37.002,
  longitude: -122.003,
};
const route: WalkingRoute = {
  geometry: {
    type: "LineString",
    coordinates: [
      [-122, 37],
      [-122.001, 37.0005],
      [-122.002, 37.001],
    ],
  },
  durationSeconds: 180,
  distanceMeters: 250,
  attribution: "openrouteservice | OpenStreetMap contributors",
};
const location = jest.mocked(Location);
const requestRoute = jest.mocked(getWalkingRoute);

beforeEach(() => {
  jest.resetAllMocks();
  mockInjected.length = 0;
  jest.mocked(placesApi.getPlaces).mockResolvedValue([room, fountain]);
  jest.mocked(getClasses).mockResolvedValue([
    {
      id: "1",
      ownerId: null,
      courseCode: "CSE 101",
      title: "Sample Course",
      instructor: null,
      meetings: [],
      saved: false,
    },
  ]);
  location.requestForegroundPermissionsAsync.mockResolvedValue({
    granted: true,
  } as Location.LocationPermissionResponse);
  location.getCurrentPositionAsync.mockResolvedValue({
    coords: currentLocation,
  } as Location.LocationObject);
  requestRoute.mockResolvedValue(route);
});

async function openRoutePlanner() {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(getRouteButton());
  return user;
}

function getRouteButton() {
  return screen.getByRole("button", { name: "Get route" });
}

async function choosePlace(
  user: ReturnType<typeof userEvent.setup>,
  field: "From" | "To",
  place: placesApi.Place,
) {
  await user.press(screen.getByRole("button", { name: field }));
  await user.type(
    screen.getByLabelText("Search classes and places"),
    place.name,
  );
  await user.press(screen.getByText(place.name));
}

function displayedRoute() {
  const prefix = "window.setWalkingRoute?.(";
  const script = mockInjected.filter((item) => item.startsWith(prefix)).at(-1);
  return script
    ? JSON.parse(script.slice(prefix.length, -"); true;".length))
    : undefined;
}

test("US-3.3-T-2 AC1: opens with current location and the selected destination", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.type(
    screen.getByLabelText("Search classes and places"),
    "Sample Room",
  );
  await user.press(await screen.findByText(room.name));
  await user.press(getRouteButton());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "From" })).toHaveTextContent(
      "Current location",
      { exact: false },
    ),
  );
  expect(screen.getByRole("button", { name: "To" })).toHaveTextContent(
    room.name,
    { exact: false },
  );
  expect(requestRoute).not.toHaveBeenCalled();
});

test("US-3.3-T-2 AC1: leaves From unselected when location access is denied", async () => {
  location.requestForegroundPermissionsAsync.mockResolvedValue({
    granted: false,
  } as Location.LocationPermissionResponse);
  await openRoutePlanner();
  expect(screen.getByRole("button", { name: "From" })).toHaveTextContent(
    "Choose starting point",
    { exact: false },
  );
});

test("US-3.3-T-2 AC2: lets the user choose From and To through search and switch From to current location", async () => {
  const user = await openRoutePlanner();
  for (const [field, place] of [
    ["From", fountain],
    ["To", room],
  ] as const) {
    await user.press(screen.getByRole("button", { name: field }));
    await user.type(screen.getByLabelText("Search classes and places"), "Sample");
    expect(screen.getByText(/CSE 101/)).toBeOnTheScreen();
    await user.press(screen.getByText(place.name));
  }
  await user.press(getRouteButton());
  await waitFor(() =>
    expect(requestRoute).toHaveBeenCalledWith(
      { latitude: fountain.latitude, longitude: fountain.longitude },
      { latitude: room.latitude, longitude: room.longitude },
    ),
  );
  await user.press(screen.getByRole("button", { name: "From" }));
  await user.press(screen.getByRole("button", { name: "Current location" }));
  await user.press(getRouteButton());
  await waitFor(() =>
    expect(requestRoute).toHaveBeenLastCalledWith(currentLocation, {
      latitude: room.latitude,
      longitude: room.longitude,
    }),
  );
});

test("US-3.3-T-2 AC3: requests a route between the selected endpoints and sends it to the map", async () => {
  const user = await openRoutePlanner();
  await choosePlace(user, "To", room);
  await user.press(getRouteButton());
  await waitFor(() => expect(displayedRoute()).toEqual(route.geometry));
  expect(requestRoute).toHaveBeenCalledWith(currentLocation, {
    latitude: room.latitude,
    longitude: room.longitude,
  });
});

test("US-3.3-T-2 AC4: displays 180 seconds as an estimated 3 minutes", async () => {
  const user = await openRoutePlanner();
  await choosePlace(user, "To", room);
  await user.press(getRouteButton());
  expect(await screen.findByText("Estimated walk: 3 min")).toBeOnTheScreen();
});

test.each(["From", "To"] as const)(
  "US-3.3-T-2 AC5: prevents requests while %s is missing",
  async (missingField) => {
    location.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Location.LocationPermissionResponse);
    const user = await openRoutePlanner();
    const selectedField = missingField === "From" ? "To" : "From";
    await choosePlace(user, selectedField, room);
    expect(getRouteButton()).toBeDisabled();
    await user.press(getRouteButton());
    expect(requestRoute).not.toHaveBeenCalled();

    await choosePlace(user, missingField, fountain);
    expect(getRouteButton()).toBeEnabled();
    await user.press(getRouteButton());
    await waitFor(() => expect(requestRoute).toHaveBeenCalledTimes(1));
  },
);

test("US-3.3-T-2 AC6: prevents duplicate requests while a route is loading", async () => {
  let resolve!: (result: WalkingRoute) => void;
  requestRoute.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const user = await openRoutePlanner();
  await choosePlace(user, "To", room);
  const button = getRouteButton();
  await user.press(button);
  expect(button).toBeDisabled();
  await user.press(button);
  expect(requestRoute).toHaveBeenCalledTimes(1);
  await act(async () => resolve(route));
  expect(getRouteButton()).toBeEnabled();
});

test("US-3.3-T-2 AC7: shows a route error and allows a successful retry", async () => {
  requestRoute.mockRejectedValueOnce(
    new Error("No walking route was found between these locations."),
  );
  const user = await openRoutePlanner();
  await choosePlace(user, "To", room);
  await user.press(getRouteButton());
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No walking route was found between these locations.",
  );
  expect(getRouteButton()).toBeEnabled();
  await user.press(getRouteButton());
  expect(await screen.findByText("Estimated walk: 3 min")).toBeOnTheScreen();
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  expect(requestRoute).toHaveBeenCalledTimes(2);
});
