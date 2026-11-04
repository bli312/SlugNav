import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { WebViewProps } from "react-native-webview";
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
jest.mock("react-native-webview", () => {
  const { forwardRef, useImperativeHandle } =
    jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: forwardRef((props: WebViewProps, ref) => {
      useImperativeHandle(ref, () => ({ injectJavaScript: jest.fn() }));
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

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(placesApi)
    .getPlaces.mockResolvedValue([fountain, farBathroom, room]);
  jest.mocked(classesApi).getClasses.mockResolvedValue([]);
});

const mapHTML = (): string => screen.getByTestId("map").props.source.html;
const centerMapAt = (latitude: number, longitude: number) =>
  fireEvent(screen.getByTestId("map"), "message", {
    nativeEvent: {
      data: JSON.stringify({ type: "map-center", latitude, longitude }),
    },
  });

test("no place pins show before searching while Show all is off", async () => {
  await render(<CampusSearch />);
  await waitFor(() => expect(placesApi.getPlaces).toHaveBeenCalled());
  expect(
    screen.getByRole("checkbox", { name: "Show all on map" }),
  ).not.toBeChecked();
  // Real pins look like L.marker([lat, lng]); the place picker script
  // always contains L.marker(point, ...), so match the bracket.
  expect(mapHTML()).not.toContain("L.marker([");
});

test("Show all puts every selected place on the map and follows the filters", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Show all on map" }));
  await waitFor(() => expect(mapHTML()).toContain("Sample Fountain"));
  expect(mapHTML()).toContain("Sample Room");
  expect(mapHTML()).toContain("Far Bathroom");
  await user.press(screen.getByRole("checkbox", { name: "Water fountains" }));
  expect(mapHTML()).not.toContain("Sample Fountain");
  expect(mapHTML()).toContain("Sample Room");
});

test("Nearby lists places near the map center, closest first, with distances", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Nearby" }));
  await centerMapAt(37, -122);
  expect(
    await screen.findByText("Within 300 m of the map center"),
  ).toBeOnTheScreen();
  const distances = screen
    .getAllByText(/ · \d+ m$/)
    .map((item) => item.props.children.join(""));
  expect(distances).toEqual(["Classroom · 0 m", "Water fountain · 56 m"]);
  expect(screen.queryByText("Far Bathroom")).not.toBeOnTheScreen();
});

test("Nearby says so when nothing is within range", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Nearby" }));
  await centerMapAt(38, -122);
  expect(
    await screen.findByText("No places within 300 m of the map center."),
  ).toBeOnTheScreen();
});

test("tapping a nearby place shows its pin on the map", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Nearby" }));
  await centerMapAt(37, -122);
  await user.press(
    await screen.findByRole("button", { name: /^Sample Fountain/ }),
  );
  expect(mapHTML()).toContain("L.marker([37.0005, -122])");
  expect(mapHTML()).toContain(".openPopup()");
  expect(mapHTML()).not.toContain("Sample Room");
});

test("typing a search hides the nearby list and shows search results", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.press(screen.getByRole("checkbox", { name: "Nearby" }));
  await centerMapAt(37, -122);
  await screen.findByText("Within 300 m of the map center");
  await user.type(screen.getByLabelText("Search classes and places"), "Far");
  expect(
    screen.queryByText("Within 300 m of the map center"),
  ).not.toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Far Bathroom Bathroom" }),
  ).toBeOnTheScreen();
});
