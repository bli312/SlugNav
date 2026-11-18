import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";

import PlaceFeedbackModal from "../../src/components/places/PlaceFeedbackModal";
import PlacePhotos from "../../src/components/places/PlacePhotos";
import { PointsToastProvider } from "../../src/components/leaderboard/PointsToast";
import * as feedbackApi from "../../src/components/places/feedback";
import * as photosApi from "../../src/components/places/photos";
import * as prepare from "../../src/components/places/preparePhoto";
import type { Place } from "../../src/components/places/places";

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: { user: { id: "student-1" } } }),
  useOptionalAuth: () => ({ session: { user: { id: "student-1" } } }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("expo-image-picker", () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock("../../src/components/places/photos", () => ({
  getPlacePhotos: jest.fn(),
  uploadPlacePhoto: jest.fn(),
  deletePlacePhoto: jest.fn(),
}));
jest.mock("../../src/components/places/preparePhoto", () => ({
  preparePhoto: jest.fn(),
}));
jest.mock("../../src/components/places/feedback", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/feedback")>(
    "../../src/components/places/feedback",
  ),
  getPlaceFeedback: jest.fn(),
}));

const photos = jest.mocked(photosApi);
const picker = jest.mocked(ImagePicker);
const preparePhoto = jest.mocked(prepare.preparePhoto);

// Synthetic place and photos; not real campus data.
const place: Place = {
  id: 42,
  name: "Sample Fountain",
  type: "water_fountain",
  latitude: 37,
  longitude: -122,
};
const photo = (
  id: number,
  userId: string,
  url = `https://signed.test/${id}`,
): photosApi.PlacePhoto => ({
  id,
  placeId: 42,
  userId,
  storagePath: `${userId}/42/${id}.jpg`,
  createdAt: `2026-11-18T0${id}:00:00Z`,
  url,
});
const newer = photo(2, "student-2");
const older = photo(1, "student-1");
const resavedJpeg = {
  data: new Uint8Array([1, 2, 3]).buffer,
  contentType: "image/jpeg",
};
const pickPhoto = () =>
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///original.heic", width: 4032, height: 3024 }],
  } as ImagePicker.ImagePickerResult);

beforeEach(() => {
  jest.clearAllMocks();
  photos.getPlacePhotos.mockResolvedValue([newer, older]);
  preparePhoto.mockResolvedValue(resavedJpeg);
  jest.mocked(feedbackApi).getPlaceFeedback.mockResolvedValue({
    votes: {},
    comments: [],
    hasReported: false,
  });
});

// Opening the whole place details window is slow the first time on some laptops.
const MODAL_TEST_TIMEOUT_MS = 15_000;

const imageUrls = () =>
  screen
    .getAllByLabelText("Photo of Sample Fountain")
    .map((image) => image.props.source.uri);

test(
  "US-3.1-T-2 the place details window shows the place's photos newest first",
  async () => {
    await render(
      <PlaceFeedbackModal place={place} visible={true} onClose={jest.fn()} />,
    );
    expect(await screen.findByText("Photos")).toBeOnTheScreen();
    await screen.findAllByLabelText("Photo of Sample Fountain");
    expect(photos.getPlacePhotos).toHaveBeenCalledWith({}, 42);
    expect(imageUrls()).toEqual([newer.url, older.url]);
  },
  MODAL_TEST_TIMEOUT_MS,
);

test("US-3.1-T-2 a place with no photos says so", async () => {
  photos.getPlacePhotos.mockResolvedValue([]);
  await render(<PlacePhotos place={place} userId="student-1" />);
  expect(
    await screen.findByText("No photos yet. Be the first to add one."),
  ).toBeOnTheScreen();
});

test("US-3.1-T-2 photos that can't load show an alert", async () => {
  photos.getPlacePhotos.mockRejectedValue(new Error("Synthetic failure"));
  await render(<PlacePhotos place={place} userId="student-1" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load photos.",
  );
});

test("US-3.1-T-2 adding a photo uploads the re-saved JPEG, not the original, and shows it first", async () => {
  const user = userEvent.setup();
  pickPhoto();
  const added = photo(3, "student-1");
  photos.uploadPlacePhoto.mockResolvedValue(added);
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Add photo" }));
  expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith({
    mediaTypes: ["images"],
  });
  expect(preparePhoto).toHaveBeenCalledWith("file:///original.heic", 4032);
  expect(photos.uploadPlacePhoto).toHaveBeenCalledWith({}, 42, resavedJpeg);
  expect(imageUrls()).toEqual([added.url, newer.url, older.url]);
});

test("US-3.1-T-2 cancelling the photo library uploads nothing", async () => {
  const user = userEvent.setup();
  picker.launchImageLibraryAsync.mockResolvedValue({
    canceled: true,
    assets: null,
  } as ImagePicker.ImagePickerResult);
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Add photo" }));
  expect(preparePhoto).not.toHaveBeenCalled();
  expect(photos.uploadPlacePhoto).not.toHaveBeenCalled();
  expect(imageUrls()).toEqual([newer.url, older.url]);
});

test("US-3.1-T-2 the Add photo button is disabled and reads Uploading… while uploading", async () => {
  const user = userEvent.setup();
  pickPhoto();
  let finishUpload: (saved: photosApi.PlacePhoto) => void = () => {};
  photos.uploadPlacePhoto.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
  );
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Add photo" }));
  const busy = await screen.findByRole("button", { name: "Uploading…" });
  expect(busy).toBeDisabled();
  await user.press(busy);
  expect(picker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);

  finishUpload(photo(3, "student-1"));
  expect(
    await screen.findByRole("button", { name: "Add photo" }),
  ).toBeEnabled();
});

test(
  "US-3.1-T-2 a successful upload shows the +20 Points! pop-up",
  async () => {
    const user = userEvent.setup();
    pickPhoto();
    photos.uploadPlacePhoto.mockResolvedValue(photo(3, "student-1"));
    await render(
      <PointsToastProvider>
        <PlaceFeedbackModal place={place} visible={true} onClose={jest.fn()} />
      </PointsToastProvider>,
    );
    await screen.findAllByLabelText("Photo of Sample Fountain");

    await user.press(screen.getByRole("button", { name: "Add photo" }));
    expect(await screen.findByText("+20 Points!")).toBeOnTheScreen();
    expect(screen.getByText("Photo added")).toBeOnTheScreen();
  },
  MODAL_TEST_TIMEOUT_MS,
);

test("US-3.1-T-2 a failed upload shows its error and leaves the list unchanged", async () => {
  const user = userEvent.setup();
  pickPhoto();
  photos.uploadPlacePhoto.mockRejectedValue(
    new Error("Photos must be 5 MB or smaller."),
  );
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Add photo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Photos must be 5 MB or smaller.",
  );
  expect(imageUrls()).toEqual([newer.url, older.url]);
});

test("US-3.1-T-2 only your own photos can be deleted, and deleting removes it", async () => {
  const user = userEvent.setup();
  photos.deletePlacePhoto.mockResolvedValue(undefined);
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  const deleteButtons = screen.getAllByRole("button", {
    name: "Delete your photo",
  });
  expect(deleteButtons).toHaveLength(1);
  const ownPhoto = screen.getAllByLabelText("Photo of Sample Fountain")[1];
  expect(
    within(ownPhoto.parent!.parent!).getByRole("button", {
      name: "Delete your photo",
    }),
  ).toBeOnTheScreen();

  await user.press(deleteButtons[0]);
  expect(photos.deletePlacePhoto).toHaveBeenCalledWith({}, older);
  expect(imageUrls()).toEqual([newer.url]);
});

test("US-3.1-T-2 a failed delete shows an alert and keeps the photo", async () => {
  const user = userEvent.setup();
  photos.deletePlacePhoto.mockRejectedValue(new Error("Synthetic failure"));
  await render(<PlacePhotos place={place} userId="student-1" />);
  await screen.findAllByLabelText("Photo of Sample Fountain");

  await user.press(screen.getByRole("button", { name: "Delete your photo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not delete the photo.",
  );
  expect(imageUrls()).toEqual([newer.url, older.url]);
});
