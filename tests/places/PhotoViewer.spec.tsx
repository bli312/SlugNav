import React, { useState } from "react";
import { expect, jest, test } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

import PhotoViewer from "../../src/components/places/PhotoViewer";
import type { PlacePhoto } from "../../src/components/places/photos";

// Synthetic photos; not real uploads.
const photo = (id: number): PlacePhoto => ({
  id,
  placeId: 42,
  userId: "student-1",
  storagePath: `student-1/42/${id}.jpg`,
  createdAt: "2026-11-25T00:00:00Z",
  url: `https://signed.test/${id}.jpg`,
});
const photos = [photo(3), photo(2), photo(1)];

// Keeps the open photo in state, the way PlacePhotos does.
function Viewer({
  start,
  list = photos,
  onClose = jest.fn(),
}: {
  start: number;
  list?: PlacePhoto[];
  onClose?: () => void;
}) {
  const [index, setIndex] = useState<number | null>(start);
  return (
    <PhotoViewer
      photos={list}
      index={index}
      placeName="Sample Fountain"
      onIndexChange={setIndex}
      onClose={() => {
        setIndex(null);
        onClose();
      }}
    />
  );
}

const shownPhoto = () =>
  screen.getByLabelText(/^Photo \d+ of \d+ of Sample Fountain$/);

test("US-4.1-T-2 the full-screen photo is labeled with its position and the place", async () => {
  await render(<Viewer start={1} />);
  expect(shownPhoto()).toHaveProp(
    "accessibilityLabel",
    "Photo 2 of 3 of Sample Fountain",
  );
  expect(shownPhoto().props.source.uri).toBe("https://signed.test/2.jpg");
  expect(screen.getByText("2 of 3")).toBeOnTheScreen();
});

test("US-4.1-T-2 Next and Previous move through the photos in thumbnail order", async () => {
  const user = userEvent.setup();
  await render(<Viewer start={0} />);
  await user.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("2 of 3")).toBeOnTheScreen();
  expect(shownPhoto().props.source.uri).toBe("https://signed.test/2.jpg");
  await user.press(screen.getByRole("button", { name: "Next" }));
  expect(shownPhoto().props.source.uri).toBe("https://signed.test/1.jpg");
  await user.press(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByText("2 of 3")).toBeOnTheScreen();
  expect(shownPhoto().props.source.uri).toBe("https://signed.test/2.jpg");
});

test("US-4.1-T-2 Previous is disabled on the first photo and Next on the last", async () => {
  const user = userEvent.setup();
  await render(<Viewer start={0} />);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  await user.press(screen.getByRole("button", { name: "Next" }));
  await user.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
});

test("US-4.1-T-2 with one photo, both Previous and Next are disabled", async () => {
  await render(<Viewer start={0} list={[photo(9)]} />);
  expect(screen.getByText("1 of 1")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("US-4.1-T-2 Close and the device back button both close the viewer", async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();
  const { rerender } = await render(<Viewer start={0} onClose={onClose} />);
  await user.press(screen.getByRole("button", { name: "Close" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("1 of 3")).not.toBeOnTheScreen();

  await rerender(<Viewer key="again" start={0} onClose={onClose} />);
  // React Native calls onRequestClose for the Android back button and Escape.
  // The event reaches the viewer's Modal from inside it.
  await fireEvent(shownPhoto(), "requestClose");
  expect(onClose).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("1 of 3")).not.toBeOnTheScreen();
});
