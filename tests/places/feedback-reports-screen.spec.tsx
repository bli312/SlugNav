import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import FeedbackReportsScreen from "../../src/components/places/FeedbackReportsScreen";
import * as feedbackApi from "../../src/components/places/feedback";

let mockAuthUser: { id: string } | null = { id: "test-user-123" };

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: mockAuthUser ? { user: mockAuthUser } : null }),
  useOptionalAuth: () => ({ session: mockAuthUser ? { user: mockAuthUser } : null }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/places/feedback", () => ({
  ...jest.requireActual<typeof import("../../src/components/places/feedback")>(
    "../../src/components/places/feedback",
  ),
  getUserSubmissions: jest.fn(),
  deleteComment: jest.fn(),
  deleteVote: jest.fn(),
}));

const api = jest.mocked(feedbackApi);

const sampleSubmissions = {
  comments: [
    {
      id: 11,
      placeId: 101,
      placeName: "Baskin Engineering 105",
      placeType: "classroom",
      content: "Quiet room during mornings",
      createdAt: "2026-11-04T00:00:00Z",
    },
  ],
  votes: [
    {
      id: 21,
      placeId: 101,
      placeName: "Baskin Engineering 105",
      placeType: "classroom",
      optionKey: "like",
      choice: "liked",
      updatedAt: "2026-11-04T00:00:00Z",
    },
    {
      id: 22,
      placeId: 102,
      placeName: "McHenry Restroom",
      placeType: "bathroom",
      optionKey: "cleanliness",
      choice: "clean",
      updatedAt: "2026-11-04T00:00:00Z",
    },
  ],
  reports: [
    {
      id: 31,
      placeId: 103,
      placeName: "Old Water Fountain",
      placeType: "water_fountain",
      reason: "closed" as const,
      details: "Water filter is red and leaking",
      createdAt: "2026-11-04T00:00:00Z",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = { id: "test-user-123" };
  api.getUserSubmissions.mockResolvedValue(sampleSubmissions);
  api.deleteComment.mockResolvedValue(undefined);
  api.deleteVote.mockResolvedValue(undefined);
});

test("renders user comments, votes & likes, and reports across tabs with deletion", async () => {
  const user = userEvent.setup();
  await render(<FeedbackReportsScreen />);

  // Expect tabs with badge counts
  expect(
    await screen.findByRole("tab", { name: "Comments (1)" }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole("tab", { name: "Votes & Likes (2)" }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole("tab", { name: "Reports (1)" }),
  ).toBeOnTheScreen();

  // 1. Comments Tab (active by default)
  expect(screen.getByText("Quiet room during mornings")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", {
      name: "Delete comment on Baskin Engineering 105",
    }),
  ).toBeOnTheScreen();

  // Delete comment
  await user.press(
    screen.getByRole("button", {
      name: "Delete comment on Baskin Engineering 105",
    }),
  );
  expect(api.deleteComment).toHaveBeenCalledWith(expect.anything(), 11);
  expect(
    screen.queryByText("Quiet room during mornings"),
  ).not.toBeOnTheScreen();

  // 2. Switch to Votes & Likes Tab
  await user.press(screen.getByRole("tab", { name: "Votes & Likes (2)" }));
  expect(screen.getByText("❤️ Liked this location")).toBeOnTheScreen();
  expect(screen.getByText(/cleanliness:/)).toBeOnTheScreen();

  // Unlike
  await user.press(
    screen.getByRole("button", {
      name: "Unlike Baskin Engineering 105",
    }),
  );
  expect(api.deleteVote).toHaveBeenCalledWith(
    expect.anything(),
    101,
    "like",
  );
  expect(
    screen.queryByText("❤️ Liked this location"),
  ).not.toBeOnTheScreen();

  // Remove vote
  await user.press(
    screen.getByRole("button", {
      name: "Remove vote for cleanliness on McHenry Restroom",
    }),
  );
  expect(api.deleteVote).toHaveBeenCalledWith(
    expect.anything(),
    102,
    "cleanliness",
  );

  // 3. Switch to Reports Tab
  await user.press(screen.getByRole("tab", { name: "Reports (1)" }));
  expect(screen.getByText("Old Water Fountain")).toBeOnTheScreen();
  expect(screen.getByText("Under Review")).toBeOnTheScreen();
  expect(screen.getByText(/Water filter is red and leaking/)).toBeOnTheScreen();
});

test("shows sign-in prompt when user is not authenticated", async () => {
  mockAuthUser = null;
  await render(<FeedbackReportsScreen />);
  expect(screen.getByText("Sign in Required")).toBeOnTheScreen();
});

test("shows empty placeholders when user has no submissions", async () => {
  const user = userEvent.setup();
  api.getUserSubmissions.mockResolvedValueOnce({
    comments: [],
    votes: [],
    reports: [],
  });

  await render(<FeedbackReportsScreen />);
  expect(await screen.findByText("No comments yet")).toBeOnTheScreen();

  await user.press(screen.getByRole("tab", { name: "Votes & Likes (0)" }));
  expect(screen.getByText("No votes or likes yet")).toBeOnTheScreen();

  await user.press(screen.getByRole("tab", { name: "Reports (0)" }));
  expect(screen.getByText("No reports submitted")).toBeOnTheScreen();
});

test("shows error banner when fetching submissions fails", async () => {
  api.getUserSubmissions.mockRejectedValueOnce(
    new Error("Network timeout loading submissions"),
  );
  await render(<FeedbackReportsScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Network timeout loading submissions",
  );
});
