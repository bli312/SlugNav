import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { WebViewProps } from "react-native-webview";
import * as Location from "expo-location";
import CampusSearch from "../../src/components/search/CampusSearch";
import * as placesApi from "../../src/components/places/places";
import * as classesApi from "../../src/components/classes/class_list/GetClasses";

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual<typeof import("react")>("react");
  return {
    useFocusEffect: (effect: React.EffectCallback) =>
      useEffect(effect, [effect]),
  };
});
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/classes/class_list/GetClasses");
jest.mock("../../src/components/places/places", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/places")>(
    "../../src/components/places/places",
  ),
  getPlaces: jest.fn(),
  createPlace: jest.fn(),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
// Records the JavaScript the app sends to the map, such as new pins.
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

// Synthetic places: the fountain is about 56 m north of the room,
// and the bathroom is about 1.1 km away.
const room: placesApi.Place = {
  id: 1,
  name: "Sample Room",
  type: "classroom",
  latitude: 37,
  longitude: -122,
};
const fountain: placesApi.Place = {
  id: 2,
  name: "Sample Fountain",
  type: "water_fountain",
  latitude: 37.0005,
  longitude: -122,
};
const farBathroom: placesApi.Place = {
  id: 3,
  name: "Far Bathroom",
  type: "bathroom",
  latitude: 37.01,
  longitude: -122,
};

const location = jest.mocked(Location);
const allowLocation = (latitude: number, longitude: number) => {
  location.requestForegroundPermissionsAsync.mockResolvedValue({
    granted: true,
  } as Location.LocationPermissionResponse);
  location.getCurrentPositionAsync.mockResolvedValue({
    coords: { latitude, longitude },
  } as Location.LocationObject);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInjected.length = 0;
  jest
    .mocked(placesApi)
    .getPlaces.mockResolvedValue([fountain, farBathroom, room]);
  jest.mocked(classesApi).getClasses.mockResolvedValue([]);
});

const mapHTML = (): string => screen.getByTestId("map").props.source.html;
// The popups of the pins most recently sent to the map.
const pinPopups = (): string[] => {
  const prefix = "window.setPins?.(";
  const script = mockInjected.filter((item) => item.startsWith(prefix)).at(-1);
  if (!script) return [];
  return JSON.parse(script.slice(prefix.length, -"); true;".length)).map(
    (pin: { popup: string }) => pin.popup,
  );
};

test("pins for every selected place type show without searching", async () => {
  await render(<CampusSearch />);
  await waitFor(() => expect(pinPopups()).toHaveLength(3));
  const popups = pinPopups().join("\n");
  expect(popups).toContain("Sample Room");
  expect(popups).toContain("Sample Fountain");
  expect(popups).toContain("Far Bathroom");
});

test("turning off a type removes its pins without rebuilding the map", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await waitFor(() => expect(pinPopups()).toHaveLength(3));
  const htmlBefore = mapHTML();
  await user.press(screen.getByRole("checkbox", { name: "Water fountains" }));
  expect(pinPopups()).toHaveLength(2);
  expect(pinPopups().join("\n")).not.toContain("Sample Fountain");
  expect(mapHTML()).toBe(htmlBefore);
});

test("Near me lists places within 300 m of you, closest first", async () => {
  const user = userEvent.setup();
  allowLocation(37, -122);
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Near me" }));
  expect(await screen.findByText("Within 300 m of you")).toBeOnTheScreen();
  const distances = screen
    .getAllByText(/ · \d+ m$/)
    .map((item) => item.props.children.join(""));
  expect(distances).toEqual(["Classroom · 0 m", "Water fountain · 56 m"]);
  expect(screen.queryByText("Far Bathroom")).not.toBeOnTheScreen();
});

test("Near me says so when nothing is within 300 m", async () => {
  const user = userEvent.setup();
  allowLocation(38, -122);
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Near me" }));
  expect(
    await screen.findByText("No places within 300 m of you."),
  ).toBeOnTheScreen();
});

test("Near me explains when location permission is denied", async () => {
  const user = userEvent.setup();
  location.requestForegroundPermissionsAsync.mockResolvedValue({
    granted: false,
  } as Location.LocationPermissionResponse);
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Near me" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /^Location is off for SlugNav/,
  );
  expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test("tapping a nearby place shows its pin on the map", async () => {
  const user = userEvent.setup();
  allowLocation(37, -122);
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Near me" }));
  await user.press(
    await screen.findByRole("button", { name: /^Sample Fountain/ }),
  );
  expect(mapHTML()).toContain("L.marker([37.0005, -122])");
  expect(mapHTML()).toContain(".openPopup()");
  expect(pinPopups()).toEqual([]);
});

test("typing a search hides the Near me list and shows search results", async () => {
  const user = userEvent.setup();
  allowLocation(37, -122);
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Near me" }));
  await screen.findByText("Within 300 m of you");
  await user.type(screen.getByLabelText("Search classes and places"), "Far");
  expect(screen.queryByText("Within 300 m of you")).not.toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Far Bathroom Bathroom" }),
  ).toBeOnTheScreen();
});
