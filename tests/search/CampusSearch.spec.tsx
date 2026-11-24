import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import type { WebViewProps } from "react-native-webview";

import CampusSearch from "../../src/components/search/CampusSearch";
import FlatListSearch from "../../src/components/search/FlatListSearch";
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

// Synthetic place and class; not real campus data.
const room: placesApi.Place = {
  id: 1,
  name: "Sample Room",
  type: "classroom",
  latitude: 37,
  longitude: -122,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(placesApi).getPlaces.mockResolvedValue([room]);
  jest.mocked(classesApi).getClasses.mockResolvedValue([
    {
      id: "1",
      ownerId: null,
      courseCode: "TEST 101",
      title: "Sample Seminar",
      instructor: null,
      meetings: [{ location: "Sample Hall", days: "Mon", time: "09:00–10:00" }],
      saved: false,
    },
  ]);
});

const searchBox = () => screen.getByLabelText("Search classes and places");
// The map stays loaded while hidden, so look it up even when it's hidden.
const hidden = { includeHiddenElements: true };
const mapArea = () => screen.getByTestId("map-area", hidden);
const mapHTML = (): string =>
  screen.getByTestId("map", hidden).props.source.html;
const mapIsHidden = () => expect(mapArea()).toHaveStyle({ display: "none" });
const mapIsShown = () => expect(mapArea()).not.toHaveStyle({ display: "none" });

test("typing a search covers the map with the results", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  mapIsShown();
  expect(screen.getByRole("button", { name: "Add place" })).toBeOnTheScreen();

  await user.type(searchBox(), "Sample");
  expect(await screen.findByText("2 results")).toBeOnTheScreen();
  expect(screen.getByText("Sample Room")).toBeOnTheScreen();
  expect(screen.getByText("TEST 101 · Sample Seminar")).toBeOnTheScreen();
  mapIsHidden();
  expect(
    screen.queryByRole("button", { name: "Add place" }),
  ).not.toBeOnTheScreen();
});

test("Show on map closes the results and shows the place on the map", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.type(searchBox(), "Sample Room");
  await user.press(
    await screen.findByRole("button", { name: "Show on map: Sample Room" }),
  );

  mapIsShown();
  expect(screen.queryByText("1 result")).not.toBeOnTheScreen();
  const html = mapHTML();
  expect(html).toContain("L.marker([37, -122])");
  expect(html).toContain(".openPopup()");
  expect(
    screen.getByRole("button", { name: "Feedback & Votes for Sample Room" }),
  ).toBeOnTheScreen();
});

test("only results with a map location get a Show on map button", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.type(searchBox(), "Sample");
  await screen.findByText("2 results");
  expect(
    screen.getAllByRole("button", { name: /^Show on map: / }),
  ).toHaveLength(1);
  expect(screen.getByText("Map location unavailable")).toBeOnTheScreen();
});

test("Back to map keeps the search, and focusing the search box reopens it", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  await user.type(searchBox(), "Sample");
  await screen.findByText("2 results");
  const htmlWhileSearching = mapHTML();

  await user.press(screen.getByRole("button", { name: "Back to map" }));
  mapIsShown();
  expect(screen.queryByText("2 results")).not.toBeOnTheScreen();
  expect(searchBox()).toHaveDisplayValue("Sample");
  // The map was hidden, not reloaded.
  expect(mapHTML()).toBe(htmlWhileSearching);

  fireEvent(searchBox(), "focus");
  expect(await screen.findByText("2 results")).toBeOnTheScreen();
  mapIsHidden();
});

test("the results list keeps its short size and no action buttons by default", async () => {
  await render(
    <FlatListSearch
      results={[
        {
          key: "place:1",
          title: "Sample Room",
          detail: "Classroom",
          place: room,
        },
      ]}
      onSelect={jest.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: /^Show on map/ }),
  ).not.toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Sample Room Classroom" }),
  ).toBeOnTheScreen();
});
