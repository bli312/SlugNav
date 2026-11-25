import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";

import PlacePhotos from "../../src/components/places/PlacePhotos";
import * as photosApi from "../../src/components/places/photos";
import type { Place } from "../../src/components/places/places";

jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("../../src/components/places/preparePhoto", () => ({
  preparePhoto: jest.fn(),
}));
jest.mock("../../src/components/places/photos", () => ({
  getPlacePhotos: jest.fn(),
  uploadPlacePhoto: jest.fn(),
  deletePlacePhoto: jest.fn(),
}));

const photos = jest.mocked(photosApi);

// Synthetic place and photos; not real campus data.
const place: Place = {
  id: 42,
  name: "Sample Fountain",
  type: "water_fountain",
  latitude: 37,
  longitude: -122,
};
const photo = (id: number, userId: string): photosApi.PlacePhoto => ({
  id,
  placeId: 42,
  userId,
  storagePath: `${userId}/42/${id}.jpg`,
  createdAt: "2026-11-25T00:00:00Z",
  url: `https://signed.test/${id}.jpg`,
});
const newest = photo(3, "student-2");
const middle = photo(2, "student-1");
const oldest = photo(1, "student-2");

beforeEach(() => {
  jest.clearAllMocks();
  photos.getPlacePhotos.mockResolvedValue([newest, middle, oldest]);
  photos.deletePlacePhoto.mockResolvedValue(undefined);
});

const fullScreenPhoto = () =>
  screen.getByLabelText(/^Photo \d+ of \d+ of Sample Fountain$/);

test("US-4.1-T-2 each thumbnail is an Open photo button that opens that photo full screen", async () => {
  const user = userEvent.setup();
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");
  expect(
    screen.getAllByRole("button", { name: /^Open photo \d of 3$/ }),
  ).toHaveLength(3);

  await user.press(screen.getByRole("button", { name: "Open photo 2 of 3" }));
  expect(fullScreenPhoto()).toHaveProp(
    "accessibilityLabel",
    "Photo 2 of 3 of Sample Fountain",
  );
  expect(fullScreenPhoto().props.source.uri).toBe(middle.url);

  await user.press(screen.getByRole("button", { name: "Close" }));
  expect(
    screen.queryByLabelText(/^Photo \d+ of \d+ of Sample Fountain$/),
  ).not.toBeOnTheScreen();
  expect(screen.getAllByLabelText("Photo of Sample Fountain")).toHaveLength(3);
});

test("US-4.1-T-2 after a photo is deleted, opening a thumbnail shows the updated total", async () => {
  const user = userEvent.setup();
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Delete your photo" }));
  expect(photos.deletePlacePhoto).toHaveBeenCalledWith({}, middle);
  expect(
    screen.getAllByRole("button", { name: /^Open photo \d of 2$/ }),
  ).toHaveLength(2);

  await user.press(screen.getByRole("button", { name: "Open photo 2 of 2" }));
  expect(fullScreenPhoto()).toHaveProp(
    "accessibilityLabel",
    "Photo 2 of 2 of Sample Fountain",
  );
  expect(fullScreenPhoto().props.source.uri).toBe(oldest.url);
  expect(screen.getByText("2 of 2")).toBeOnTheScreen();
});
