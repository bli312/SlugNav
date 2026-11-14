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
import PlaceMap from "../../src/components/places/PlaceMap";
import * as api from "../../src/components/places/places";

const mockInject = jest.fn();
jest.mock("react-native-webview", () => {
  const { forwardRef, useImperativeHandle } =
    jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    WebView: forwardRef((props: WebViewProps, ref) => {
      useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
      return <View testID="map" {...props} />;
    }),
  };
});
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/places/places", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/places")>(
    "../../src/components/places/places",
  ),
  createPlace: jest.fn(),
}));

const create = jest.mocked(api.createPlace);
const place: api.Place = {
  id: 1,
  name: "Sample room",
  type: "classroom",
  latitude: 37,
  longitude: -122,
};
const tapMap = (latitude = 37) =>
  fireEvent(screen.getByTestId("map"), "message", {
    nativeEvent: {
      data: JSON.stringify({
        type: "place-location",
        latitude,
        longitude: -122,
      }),
    },
  });
beforeEach(() => {
  jest.clearAllMocks();
  create.mockResolvedValue(place);
});

test("map selections can move, saving uses the latest pin, and the saved pin is shown", async () => {
  const user = userEvent.setup();
  await render(<PlaceMap markers={[]} />);
  await user.press(screen.getByRole("button", { name: "Add place" }));
  expect(mockInject).toHaveBeenLastCalledWith(
    "window.setPlacePicking?.(true); true;",
  );
  await fireEvent(screen.getByTestId("map"), "loadEnd");

  expect(screen.getByText("Creation is for all UCSC users.")).toBeOnTheScreen();

  expect(screen.getByLabelText("Place name")).toHaveDisplayValue("");
  expect(screen.getByRole("radio", { name: "Classroom" })).not.toBeChecked();
  const initialHTML = screen.getByTestId("map").props.source.html;
  await tapMap(36);
  await tapMap(37);
  await user.type(screen.getByLabelText("Place name"), place.name);
  await user.press(screen.getByRole("radio", { name: "Classroom" }));
  expect(screen.getByTestId("map").props.source.html).toBe(initialHTML);
  await user.press(screen.getByRole("button", { name: "Save place" }));
  expect(create).toHaveBeenCalledWith(
    expect.anything(),
    place.name,
    "classroom",
    {
      latitude: 37,
      longitude: -122,
    },
  );
  expect(await screen.findByText("Place added.")).toBeOnTheScreen();
  await user.press(screen.getByRole("button", { name: "Feedback & Votes" }));
  expect(
    screen.getByRole("button", { name: "Close feedback modal" }),
  ).toBeOnTheScreen();
  await user.press(
    screen.getByRole("button", { name: "Close feedback modal" }),
  );
  expect(
    screen.queryByRole("button", { name: "Close feedback modal" }),
  ).not.toBeOnTheScreen();
  expect(screen.getByTestId("map").props.source.html).toContain(
    "L.marker([37, -122])",
  );
  expect(screen.getByTestId("map").props.source.html).toContain(place.name);
});

test("cancel clears the draft and turns off pin selection without saving", async () => {
  const user = userEvent.setup();
  await render(<PlaceMap markers={[]} />);
  await user.press(screen.getByRole("button", { name: "Add place" }));
  await tapMap();
  await user.type(screen.getByLabelText("Place name"), "Cancelled");
  await user.press(screen.getByRole("button", { name: "Cancel" }));
  expect(create).not.toHaveBeenCalled();
  expect(mockInject).toHaveBeenLastCalledWith(
    "window.setPlacePicking?.(false); true;",
  );
  await user.press(screen.getByRole("button", { name: "Add place" }));
  expect(screen.getByLabelText("Place name")).toHaveDisplayValue("");
  expect(
    screen.getByText("Tap the map to choose a location."),
  ).toBeOnTheScreen();
});

test("a pending save prevents repeat submissions; failure keeps the form for retry", async () => {
  let reject: (error: Error) => void = () => undefined;
  create.mockImplementationOnce(
    () =>
      new Promise((_resolve, rejectSave) => {
        reject = rejectSave;
      }),
  );
  const user = userEvent.setup();
  await render(<PlaceMap markers={[]} />);
  await user.press(screen.getByRole("button", { name: "Add place" }));
  await tapMap();
  await user.type(screen.getByLabelText("Place name"), place.name);
  await user.press(screen.getByRole("radio", { name: "Classroom" }));
  await user.press(screen.getByRole("button", { name: "Save place" }));
  const saving = screen.getByRole("button", { name: "Saving…" });
  expect(saving).toBeDisabled();
  await user.press(saving);
  expect(create).toHaveBeenCalledTimes(1);
  await act(async () =>
    reject(new Error("Could not save the place. Please try again.")),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not save the place. Please try again.",
  );
  expect(screen.getByLabelText("Place name")).toHaveDisplayValue(place.name);
  expect(screen.getByRole("radio", { name: "Classroom" })).toBeChecked();
  await user.press(screen.getByRole("button", { name: "Save place" }));
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[1]).toEqual(create.mock.calls[0]);
});
