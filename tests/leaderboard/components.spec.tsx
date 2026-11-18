import React from "react";
import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import LeaderboardScreen from "../../src/components/leaderboard/LeaderboardScreen";
import * as leaderboardApi from "../../src/components/leaderboard/leaderboard";

let mockAuthUser: { id: string } | null = { id: "user-1" };

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: mockAuthUser ? { user: mockAuthUser } : null }),
  useOptionalAuth: () => ({
    session: mockAuthUser ? { user: mockAuthUser } : null,
  }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/leaderboard/leaderboard", () => ({
  ...jest.requireActual<
    typeof import("../../src/components/leaderboard/leaderboard")
  >("../../src/components/leaderboard/leaderboard"),
  getLeaderboard: jest.fn(),
  getUserRank: jest.fn(),
  updateDisplayName: jest.fn(),
}));

const api = jest.mocked(leaderboardApi);

const sampleLeaderboard = [
  {
    rank: 1,
    userId: "user-1",
    displayName: "Sammy Slug",
    totalPoints: 150,
    contributionsCount: 6,
  },
  {
    rank: 2,
    userId: "user-2",
    displayName: "Slug 2222",
    totalPoints: 95,
    contributionsCount: 4,
  },
  {
    rank: 3,
    userId: "user-3",
    displayName: "Porter Owl",
    totalPoints: 60,
    contributionsCount: 3,
  },
];

const sampleUserRank = {
  rank: 1,
  userId: "user-1",
  displayName: "Sammy Slug",
  totalPoints: 150,
  contributionsCount: 6,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = { id: "user-1" };
  api.getLeaderboard.mockResolvedValue(sampleLeaderboard);
  api.getUserRank.mockResolvedValue(sampleUserRank);
  api.updateDisplayName.mockResolvedValue("Super Slug");
});

test("US-3.2-T-1 renders student standing banner and highlights logged-in student", async () => {
  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("YOUR STANDING")).toBeOnTheScreen();
  });

  // Current student info in banner and leaderboard list
  expect(screen.getAllByText("Sammy Slug").length).toBe(2);
  expect(screen.getAllByText("150 pts").length).toBe(2);
  expect(screen.getByText("6")).toBeOnTheScreen();
  expect(screen.getAllByText("🥇 #1").length).toBe(2);

  // Leaderboard entries rendered
  expect(screen.getByText("Campus Rankings")).toBeOnTheScreen();
  expect(screen.getByText("Slug 2222")).toBeOnTheScreen();
  expect(screen.getByText("95 pts")).toBeOnTheScreen();
  expect(screen.getByText("Porter Owl")).toBeOnTheScreen();
  expect(screen.getByText("60 pts")).toBeOnTheScreen();

  // (You) badge marks current user
  expect(screen.getByText("You")).toBeOnTheScreen();
});

test("US-3.2-T-1 ensures privacy: never exposes student email addresses or schedules", async () => {
  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("YOUR STANDING")).toBeOnTheScreen();
  });

  // Check privacy banner
  expect(
    screen.getByText(
      "🔒 Anonymous by default: Emails and schedules are never shared.",
    ),
  ).toBeOnTheScreen();

  // Ensure no email address or student class schedules are in the rendered tree
  expect(screen.queryByText(/@ucsc\.edu/i)).toBeNull();
  expect(screen.queryByText(/@gmail\.com/i)).toBeNull();
  expect(screen.queryByText(/CSE 115A/i)).toBeNull();
  expect(screen.queryByText(/enrolled/i)).toBeNull();
  expect(screen.queryByText(/class_id/i)).toBeNull();
});

test("US-3.2-T-1 allows editing display name and updating on screen", async () => {
  const user = userEvent.setup();
  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("✏️ Edit Display Name")).toBeOnTheScreen();
  });

  // Click edit display name
  await user.press(
    screen.getByRole("button", { name: "Change your display name" }),
  );

  const input = screen.getByLabelText("Enter display name");
  expect(input).toBeOnTheScreen();

  // Type new name and save
  await user.clear(input);
  await user.type(input, "Super Slug");
  await user.press(screen.getByRole("button", { name: "Save display name" }));

  await waitFor(() => {
    expect(api.updateDisplayName).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      "Super Slug",
    );
  });

  // Verify updated name displays
  await waitFor(() => {
    expect(screen.getAllByText("Super Slug").length).toBeGreaterThan(0);
  });
});

test("US-3.2-T-1 handles cancel and error when editing display name", async () => {
  const user = userEvent.setup();
  api.updateDisplayName.mockRejectedValueOnce(
    new Error("Display name must be 32 characters or fewer."),
  );

  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("✏️ Edit Display Name")).toBeOnTheScreen();
  });

  await user.press(
    screen.getByRole("button", { name: "Change your display name" }),
  );
  const input = screen.getByLabelText("Enter display name");
  await user.type(input, "Something");

  // Press save and expect error message
  await user.press(screen.getByRole("button", { name: "Save display name" }));

  await waitFor(() => {
    expect(
      screen.getByText("Display name must be 32 characters or fewer."),
    ).toBeOnTheScreen();
  });

  // Press cancel to exit edit mode
  await user.press(
    screen.getByRole("button", { name: "Cancel editing display name" }),
  );
  expect(screen.queryByLabelText("Enter display name")).toBeNull();
});

test("US-3.2-T-1 displays empty state when there are no contributors yet", async () => {
  api.getLeaderboard.mockResolvedValue([]);
  api.getUserRank.mockResolvedValue({
    rank: null,
    userId: "user-1",
    displayName: "Slug 1111",
    totalPoints: 0,
    contributionsCount: 0,
  });

  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("No Contributors Yet")).toBeOnTheScreen();
  });

  expect(screen.getByText("Unranked")).toBeOnTheScreen();
  expect(screen.getByText("0 pts")).toBeOnTheScreen();
});

test("US-3.2-T-1 displays error and allows retrying fetch", async () => {
  const user = userEvent.setup();
  api.getLeaderboard.mockRejectedValueOnce(
    new Error("Network connection lost."),
  );

  await render(<LeaderboardScreen />);

  await waitFor(() => {
    expect(screen.getByText("Network connection lost.")).toBeOnTheScreen();
  });

  const retryBtn = screen.getByRole("button", { name: "Retry" });
  expect(retryBtn).toBeOnTheScreen();

  api.getLeaderboard.mockResolvedValue(sampleLeaderboard);
  await user.press(retryBtn);

  await waitFor(() => {
    expect(screen.getByText("YOUR STANDING")).toBeOnTheScreen();
  });
});
