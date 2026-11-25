import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import PlaceFeedbackModal from "../../src/components/places/PlaceFeedbackModal";
import * as feedbackApi from "../../src/components/places/feedback";
import type { Place } from "../../src/components/places/places";

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: { user: { id: "test-user-123" } } }),
  useOptionalAuth: () => ({ session: { user: { id: "test-user-123" } } }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/places/feedback", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/feedback")>(
    "../../src/components/places/feedback",
  ),
  getPlaceFeedback: jest.fn(),
  castVote: jest.fn(),
  deleteVote: jest.fn(),
  postComment: jest.fn(),
  deleteComment: jest.fn(),
  submitReport: jest.fn(),
}));

const api = jest.mocked(feedbackApi);

const samplePlace: Place = {
  id: 101,
  name: "Baskin Engineering 105",
  type: "classroom",
  latitude: 37.0,
  longitude: -122.06,
};

beforeEach(() => {
  jest.clearAllMocks();
  api.getPlaceFeedback.mockResolvedValue({
    votes: {
      outlets: {
        counts: { many: 3, few: 1 },
        total: 4,
        userChoice: "many",
      },
    },
    comments: [
      {
        id: 1,
        placeId: 101,
        userId: "test-user-123",
        content: "Power strips under front desks",
        createdAt: "2026-11-04T00:00:00Z",
      },
    ],
    hasReported: false,
  });
  api.castVote.mockResolvedValue(undefined);
  api.deleteVote.mockResolvedValue(undefined);
  api.postComment.mockResolvedValue({
    id: 2,
    placeId: 101,
    userId: "test-user-123",
    content: "New comment test",
    createdAt: "2026-11-04T01:00:00Z",
  });
  api.deleteComment.mockResolvedValue(undefined);
  api.submitReport.mockResolvedValue(undefined);
});

test("renders place details, voting choices, and handles casting vote", async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();

  await render(
    <PlaceFeedbackModal place={samplePlace} visible={true} onClose={onClose} />,
  );

  expect(await screen.findByText(/Baskin Engineering 105/)).toBeOnTheScreen();
  expect(screen.getByText(/Classroom · Community Feedback/)).toBeOnTheScreen();

  // Check that predefined options appear
  expect(screen.getByText("Outlets")).toBeOnTheScreen();
  expect(screen.getByText("Projector")).toBeOnTheScreen();

  // Test liking location
  const likeButton = screen.getByRole("button", { name: "Like this location" });
  await user.press(likeButton);
  expect(api.castVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "like",
    "liked",
  );

  // Cast vote for Outlets -> Few
  const fewButton = screen.getByRole("button", { name: /Outlets: Few/ });
  await user.press(fewButton);
  expect(api.castVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "outlets",
    "few",
  );

  // Close modal
  await user.press(
    screen.getByRole("button", { name: "Close feedback modal" }),
  );
  expect(onClose).toHaveBeenCalled();
});

test("posting a comment and deleting an existing comment", async () => {
  const user = userEvent.setup();
  await render(
    <PlaceFeedbackModal
      place={samplePlace}
      visible={true}
      onClose={() => {}}
    />,
  );

  expect(
    await screen.findByText("Power strips under front desks"),
  ).toBeOnTheScreen();

  // Type new comment and post
  const input = screen.getByLabelText("Write a comment");
  await user.type(input, "New comment test");
  await user.press(screen.getByRole("button", { name: "Post comment" }));

  expect(api.postComment).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "New comment test",
  );

  // Delete own comment
  await user.press(screen.getByRole("button", { name: "Delete comment 1" }));
  expect(api.deleteComment).toHaveBeenCalledWith(expect.anything(), 1);
});

test("submitting a report opens form and sends report", async () => {
  const user = userEvent.setup();
  await render(
    <PlaceFeedbackModal
      place={samplePlace}
      visible={true}
      onClose={() => {}}
    />,
  );

  await screen.findByText(/Baskin Engineering 105/);

  // Open report form
  await user.press(
    screen.getByRole("button", { name: "Report an issue with this place" }),
  );
  expect(screen.getByText("Select reason:")).toBeOnTheScreen();

  // Cancel report form
  await user.press(screen.getByRole("button", { name: "Cancel report" }));
  expect(screen.queryByText("Select reason:")).not.toBeOnTheScreen();

  // Reopen report form
  await user.press(
    screen.getByRole("button", { name: "Report an issue with this place" }),
  );
  expect(screen.getByText("Select reason:")).toBeOnTheScreen();

  // Select reason and add details
  await user.press(screen.getByRole("radio", { name: "Duplicate place" }));
  await user.type(
    screen.getByLabelText("Report details"),
    "Listed twice in directory",
  );

  // Submit
  await user.press(screen.getByRole("button", { name: "Submit report" }));
  expect(api.submitReport).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "duplicate",
    "Listed twice in directory",
  );

  expect(
    await screen.findByText(/You have reported this place for review/),
  ).toBeOnTheScreen();
});
