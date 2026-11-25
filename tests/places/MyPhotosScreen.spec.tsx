import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";

import MyPhotosScreen from "../../src/components/places/MyPhotosScreen";
import * as photosApi from "../../src/components/places/photos";

jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/places/photos", () => ({
  getMyPhotos: jest.fn(),
  deletePlacePhoto: jest.fn(),
}));

const photos = jest.mocked(photosApi);

// Synthetic photos; noon UTC so the date is the same in US time zones.
const myPhoto = (
  id: number,
  placeName: string,
  createdAt: string,
): photosApi.MyPhoto => ({
  id,
  placeId: id * 10,
  userId: "student-1",
  storagePath: `student-1/${id * 10}/${id}.jpg`,
  createdAt,
  url: `https://signed.test/${id}.jpg`,
  placeName,
});
const fountain = myPhoto(2, "Sample Fountain", "2026-11-25T12:00:00Z");
const room = myPhoto(1, "Sample Room", "2026-11-20T12:00:00Z");

beforeEach(() => {
  jest.clearAllMocks();
  photos.getMyPhotos.mockResolvedValue([fountain, room]);
  photos.deletePlacePhoto.mockResolvedValue(undefined);
});

test("US-4.1-T-1 My photos lists each photo newest first with its place and date added", async () => {
  await render(<MyPhotosScreen />);
  expect(await screen.findByText("Sample Fountain")).toBeOnTheScreen();
  expect(photos.getMyPhotos).toHaveBeenCalledWith({});
  const places = screen
    .getAllByText(/^Sample (Fountain|Room)$/)
    .map((item) => item.props.children);
  expect(places).toEqual(["Sample Fountain", "Sample Room"]);
  expect(screen.getByText("Added Nov 25, 2026")).toBeOnTheScreen();
  expect(screen.getByText("Added Nov 20, 2026")).toBeOnTheScreen();
});

test("US-4.1-T-1 My photos says so when you have no photos", async () => {
  photos.getMyPhotos.mockResolvedValue([]);
  await render(<MyPhotosScreen />);
  expect(
    await screen.findByText("You haven't added any photos yet."),
  ).toBeOnTheScreen();
});

test("US-4.1-T-1 My photos shows the error when loading fails", async () => {
  photos.getMyPhotos.mockRejectedValue(
    new Error("Could not load your photos."),
  );
  await render(<MyPhotosScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load your photos.",
  );
});

test("US-4.1-T-1 tapping a photo opens it full screen with its place name", async () => {
  const user = userEvent.setup();
  await render(<MyPhotosScreen />);
  await user.press(
    await screen.findByRole("button", { name: "Open photo 2 of 2" }),
  );
  const shown = screen.getByLabelText("Photo 2 of 2 of Sample Room");
  expect(shown.props.source.uri).toBe(room.url);

  await user.press(screen.getByRole("button", { name: "Previous" }));
  expect(
    screen.getByLabelText("Photo 1 of 2 of Sample Fountain"),
  ).toBeOnTheScreen();
});

test("US-4.1-T-1 deleting a photo removes it from the list", async () => {
  const user = userEvent.setup();
  await render(<MyPhotosScreen />);
  await user.press(
    await screen.findByRole("button", {
      name: "Delete photo of Sample Fountain",
    }),
  );
  expect(photos.deletePlacePhoto).toHaveBeenCalledWith({}, fountain);
  expect(screen.queryByText("Sample Fountain")).not.toBeOnTheScreen();
  expect(screen.getByText("Sample Room")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Open photo 1 of 1" }),
  ).toBeOnTheScreen();
});

test("US-4.1-T-1 a failed delete shows an alert and keeps the photo", async () => {
  const user = userEvent.setup();
  photos.deletePlacePhoto.mockRejectedValue(new Error("Synthetic failure"));
  await render(<MyPhotosScreen />);
  await user.press(
    await screen.findByRole("button", {
      name: "Delete photo of Sample Fountain",
    }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not delete the photo.",
  );
  expect(screen.getByText("Sample Fountain")).toBeOnTheScreen();
});
