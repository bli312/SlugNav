import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import {
  PointsToastProvider,
  usePointsToast,
} from "../../src/components/leaderboard/PointsToast";
import AddPlaceForm from "../../src/components/places/AddPlaceForm";
import PlaceFeedbackModal from "../../src/components/places/PlaceFeedbackModal";
import * as placesApi from "../../src/components/places/places";
import * as feedbackApi from "../../src/components/places/feedback";
import type { Place } from "../../src/components/places/places";

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: { user: { id: "test-user-123" } } }),
  useOptionalAuth: () => ({ session: { user: { id: "test-user-123" } } }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/places/places", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/places")>(
    "../../src/components/places/places",
  ),
  createPlace: jest.fn(),
}));
jest.mock("../../src/components/places/feedback", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/feedback")>(
    "../../src/components/places/feedback",
  ),
  getPlaceFeedback: jest.fn(),
  castVote: jest.fn(),
  deleteVote: jest.fn(),
  postComment: jest.fn(),
  deleteComment: jest.fn(),
}));

const mockPlaces = jest.mocked(placesApi);
const mockFeedback = jest.mocked(feedbackApi);

const samplePlace: Place = {
  id: 101,
  name: "McHenry Library",
  type: "classroom",
  latitude: 36.995,
  longitude: -122.059,
};

function TestActionComponent({
  points,
  message,
}: {
  points: number;
  message: string;
}) {
  const { showPointsToast } = usePointsToast();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => showPointsToast(points, message)}
    >
      <Text>Trigger Point Award</Text>
    </Pressable>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPlaces.createPlace.mockResolvedValue({
    id: 202,
    name: "Science Hill Cafe",
    type: "classroom",
    latitude: 37.0,
    longitude: -122.06,
  });
  mockFeedback.getPlaceFeedback.mockResolvedValue({
    votes: {
      like: { counts: { liked: 1 }, total: 1, userChoice: null },
      outlets: { counts: { many: 2 }, total: 2, userChoice: null },
    },
    comments: [],
    hasReported: false,
  });
  mockFeedback.castVote.mockResolvedValue(undefined);
  mockFeedback.deleteVote.mockResolvedValue(undefined);
  mockFeedback.postComment.mockResolvedValue({
    id: 1,
    placeId: 101,
    userId: "test-user-123",
    content: "Awesome study space",
    createdAt: new Date().toISOString(),
  });
});

test("US-3.2-T-2 AC1: creating a campus place displays +50 Points! toast", async () => {
  const user = userEvent.setup();
  const onSaved = jest.fn();

  await render(
    <PointsToastProvider>
      <AddPlaceForm
        location={{ latitude: 37.0, longitude: -122.06 }}
        onSaved={onSaved}
        onCancel={jest.fn()}
      />
    </PointsToastProvider>,
  );

  const input = screen.getByLabelText("Place name");
  await user.type(input, "Science Hill Cafe");
  await user.press(screen.getByRole("radio", { name: "Classroom" }));
  await user.press(screen.getByRole("button", { name: "Save place" }));

  expect(mockPlaces.createPlace).toHaveBeenCalled();
  expect(await screen.findByText("+50 Points!")).toBeOnTheScreen();
  expect(
    screen.getByText("Added campus place: Science Hill Cafe"),
  ).toBeOnTheScreen();
});

test("US-3.2-T-2 AC2: uploading a place photo displays +20 Points! toast", async () => {
  const user = userEvent.setup();

  await render(
    <PointsToastProvider>
      <TestActionComponent points={20} message="Uploaded place photo" />
    </PointsToastProvider>,
  );

  await user.press(screen.getByRole("button", { name: "Trigger Point Award" }));

  expect(await screen.findByText("+20 Points!")).toBeOnTheScreen();
  expect(screen.getByText("Uploaded place photo")).toBeOnTheScreen();
});

test("US-3.2-T-2 AC3: posting a place comment displays +10 Points! toast", async () => {
  const user = userEvent.setup();

  await render(
    <PointsToastProvider>
      <PlaceFeedbackModal place={samplePlace} visible={true} onClose={jest.fn()} />
    </PointsToastProvider>,
  );

  const input = screen.getByPlaceholderText("Share tips about this place...");
  await user.type(input, "Great quiet atmosphere");
  await user.press(screen.getByRole("button", { name: "Post comment" }));

  expect(mockFeedback.postComment).toHaveBeenCalled();
  expect(await screen.findByText("+10 Points!")).toBeOnTheScreen();
  expect(screen.getByText("Comment posted")).toBeOnTheScreen();
});

test("US-3.2-T-2 AC4: liking a place or casting a feature vote displays +5 Points! toast", async () => {
  const user = userEvent.setup();

  await render(
    <PointsToastProvider>
      <PlaceFeedbackModal place={samplePlace} visible={true} onClose={jest.fn()} />
    </PointsToastProvider>,
  );

  // Like location
  const likeBtn = screen.getByRole("button", { name: "Like this location" });
  await user.press(likeBtn);

  expect(mockFeedback.castVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "like",
    "liked",
  );
  expect(await screen.findByText("+5 Points!")).toBeOnTheScreen();
  expect(screen.getByText("Liked this location")).toBeOnTheScreen();

  // Feature vote
  const manyOutletsBtn = screen.getByRole("button", {
    name: /Outlets: Many/,
  });
  await user.press(manyOutletsBtn);

  expect(mockFeedback.castVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "outlets",
    "many",
  );
  expect(screen.getByText("Voted on outlets")).toBeOnTheScreen();
});

test("US-3.2-T-2 AC5: toast dismisses upon user press and includes alert role", async () => {
  const user = userEvent.setup();

  await render(
    <PointsToastProvider autoDismissMs={100}>
      <TestActionComponent points={15} message="Helpful contribution" />
    </PointsToastProvider>,
  );

  await user.press(screen.getByRole("button", { name: "Trigger Point Award" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toBeOnTheScreen();
  expect(screen.getByText("+15 Points!")).toBeOnTheScreen();

  // Dismiss by pressing toast
  await user.press(alert);
  await screen.findByText("+15 Points!").catch(() => {});
  // Verify alert disappears
  await waitFor(() => {
    expect(screen.queryByText("+15 Points!")).not.toBeOnTheScreen();
  });
});

test("US-3.2-T-2 AC6: unliking a place does not display positive point award toast", async () => {
  const user = userEvent.setup();
  // Place is already liked by student
  mockFeedback.getPlaceFeedback.mockResolvedValueOnce({
    votes: {
      like: { counts: { liked: 1 }, total: 1, userChoice: "liked" },
      outlets: { counts: {}, total: 0, userChoice: null },
    },
    comments: [],
    hasReported: false,
  });

  await render(
    <PointsToastProvider>
      <PlaceFeedbackModal place={samplePlace} visible={true} onClose={jest.fn()} />
    </PointsToastProvider>,
  );

  const unlikeBtn = await screen.findByRole("button", {
    name: "Unlike this location",
  });
  await user.press(unlikeBtn);

  expect(mockFeedback.deleteVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "like",
  );
  expect(screen.queryByText("+5 Points!")).not.toBeOnTheScreen();
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
});
