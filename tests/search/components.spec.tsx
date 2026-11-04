import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
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

const places = jest.mocked(placesApi);
const classes = jest.mocked(classesApi);
const room: placesApi.Place = {
  id: 1,
  name: "Sample Room",
  type: "classroom",
  latitude: 37,
  longitude: -122,
};
beforeEach(() => {
  jest.clearAllMocks();
  places.getPlaces.mockResolvedValue([
    room,
    { ...room, id: 2, name: "Sample Fountain", type: "water_fountain" },
  ]);
  classes.getClasses.mockResolvedValue([
    {
      id: "1",
      ownerId: null,
      courseCode: "TEST 101",
      title: "Field Studies",
      instructor: null,
      meetings: [{ location: "Sample Room", days: "Mon", time: "09:00–10:00" }],
      saved: false,
    },
  ]);
});

test("home search uses database results, filters categories and opens the selected place's map popup", async () => {
  const user = userEvent.setup();
  await render(<CampusSearch />);
  expect(screen.queryByText("Sample Room")).not.toBeOnTheScreen();
  expect(screen.queryByText("Sample Fountain")).not.toBeOnTheScreen();
  expect(screen.queryByText("TEST 101 · Field Studies")).not.toBeOnTheScreen();
  expect(screen.queryByText("No matching results.")).not.toBeOnTheScreen();
  await user.type(screen.getByLabelText("Search classes and places"), "Sample");
  await screen.findByText("Sample Room");
  expect(screen.getByText("Sample Fountain")).toBeOnTheScreen();
  await user.press(screen.getByRole("checkbox", { name: "Classrooms" }));
  expect(screen.queryByText("Sample Room")).not.toBeOnTheScreen();
  await user.press(screen.getByRole("checkbox", { name: "Classrooms" }));
  await user.clear(screen.getByLabelText("Search classes and places"));
  await user.type(
    screen.getByLabelText("Search classes and places"),
    "TEST 101",
  );
  expect(screen.getByText("TEST 101 · Field Studies")).toBeOnTheScreen();
  expect(screen.getByText("Sample Room · Mon · 09:00–10:00")).toBeOnTheScreen();
  expect(screen.getByText("Map location unavailable")).toBeOnTheScreen();
  await user.clear(screen.getByLabelText("Search classes and places"));
  await user.type(
    screen.getByLabelText("Search classes and places"),
    "Sample Room",
  );
  await user.press(
    screen.getByRole("button", { name: "Sample Room Classroom" }),
  );
  await user.press(
    screen.getByRole("button", { name: "Feedback & Votes for Sample Room" }),
  );
  expect(
    screen.getByRole("button", { name: "Close feedback modal" }),
  ).toBeOnTheScreen();
  await user.press(
    screen.getByRole("button", { name: "Close feedback modal" }),
  );
  expect(
    screen.queryByRole("button", { name: "Close feedback modal" }),
  ).not.toBeOnTheScreen();
  const html = screen.getByTestId("map").props.source.html;
  expect(html).toContain("L.marker([37, -122])");
  expect(html).toContain("Sample Room");
  expect(html).toContain(".openPopup()");
  await user.clear(screen.getByLabelText("Search classes and places"));
  expect(screen.queryByText("Sample Room")).not.toBeOnTheScreen();
  expect(screen.queryByText("TEST 101 · Field Studies")).not.toBeOnTheScreen();
  expect(screen.queryByText("No matching results.")).not.toBeOnTheScreen();
  expect(classes.getClasses).toHaveBeenCalledTimes(1);
  expect(places.getPlaces).toHaveBeenCalledTimes(1);
});

test.each(["before", "after"])(
  "a place saved %s the initial load finishes is searchable without reloading",
  async (timing) => {
    const user = userEvent.setup();
    let finishLoading = () => {};
    classes.getClasses.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishLoading = () => resolve([]);
        }),
    );
    places.createPlace.mockResolvedValue({ ...room, id: 3, name: "New room" });
    await render(<CampusSearch />);
    if (timing === "after") await act(async () => finishLoading());
    await user.press(screen.getByRole("button", { name: "Add place" }));
    expect(
      screen.queryByLabelText("Search classes and places"),
    ).not.toBeOnTheScreen();
    await fireEvent(screen.getByTestId("map"), "message", {
      nativeEvent: {
        data: JSON.stringify({
          type: "place-location",
          latitude: 37,
          longitude: -122,
        }),
      },
    });
    await user.type(screen.getByLabelText("Place name"), "New room");
    await user.press(screen.getByRole("radio", { name: "Classroom" }));
    await user.press(screen.getByRole("button", { name: "Save place" }));
    expect(await screen.findByText("Place added.")).toBeOnTheScreen();
    if (timing === "before") await act(async () => finishLoading());
    expect(screen.queryByText("New room")).not.toBeOnTheScreen();
    await user.type(
      screen.getByLabelText("Search classes and places"),
      "New room",
    );
    expect(
      screen.getByRole("button", { name: "New room Classroom" }),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Sample Room")).not.toBeOnTheScreen();
  },
);

test("search load failures show an error instead of an empty result list", async () => {
  const user = userEvent.setup();
  places.getPlaces.mockRejectedValueOnce(new Error("Synthetic failure"));
  await render(<CampusSearch />);
  await user.type(screen.getByLabelText("Search classes and places"), "Room");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load search results.",
  );
  expect(screen.queryByText("No matching results.")).not.toBeOnTheScreen();
});
