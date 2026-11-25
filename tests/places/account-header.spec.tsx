import { expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";

import AccountHeader from "../../src/components/account_header/AccountHeader";

test("renders Feedback and Report button and handles navigation", async () => {
  const user = userEvent.setup();
  const onNavigateFeedback = jest.fn();
  const onNavigateClasses = jest.fn();
  const onSignOut = jest.fn();

  await render(
    <AccountHeader
      userEmail="student@ucsc.edu"
      busy={false}
      onSignOut={onSignOut}
      onNavigateClasses={onNavigateClasses}
      onNavigateFeedbackReports={onNavigateFeedback}
    />,
  );

  // verify header information
  expect(screen.getByText("SlugNav")).toBeOnTheScreen();
  expect(screen.getByText("student@ucsc.edu")).toBeOnTheScreen();

  // menu should initially be closed
  const toggleButton = screen.getByRole("button", {
    name: "Toggle Sandwich",
  });
  expect(toggleButton).toBeOnTheScreen();
  expect(
    screen.queryByRole("button", { name: "Feedback and Report" }),
  ).toBeNull();

  // open sandwich menu
  await user.press(toggleButton);

  // verify menu options appear
  const feedbackButton = screen.getByRole("button", {
    name: "Feedback and Report",
  });
  const classesButton = screen.getByRole("button", { name: "Classes" });
  const signOutButton = screen.getByRole("button", { name: "Sign Out" });

  expect(feedbackButton).toBeOnTheScreen();
  expect(classesButton).toBeOnTheScreen();
  expect(signOutButton).toBeOnTheScreen();

  // test feedback navigation
  await user.press(feedbackButton);
  expect(onNavigateFeedback).toHaveBeenCalledTimes(1);

  // menu should close after selection
  expect(
    screen.queryByRole("button", { name: "Feedback and Report" }),
  ).toBeNull();

  // reopen menu before testing another option
  await user.press(toggleButton);

  const classesButtonAgain = screen.getByRole("button", {
    name: "Classes",
  });

  await user.press(classesButtonAgain);
  expect(onNavigateClasses).toHaveBeenCalledTimes(1);

  // reopen menu before testing sign out
  await user.press(toggleButton);

  const signOutButtonAgain = screen.getByRole("button", {
    name: "Sign Out",
  });

  await user.press(signOutButtonAgain);
  expect(onSignOut).toHaveBeenCalledTimes(1);
});

test("renders Leaderboard button and handles navigation when callback provided", async () => {
  const user = userEvent.setup();
  const onNavigateLeaderboard = jest.fn();

  await render(
    <AccountHeader
      userEmail="student@ucsc.edu"
      busy={false}
      onSignOut={jest.fn()}
      onNavigateClasses={jest.fn()}
      onNavigateLeaderboard={onNavigateLeaderboard}
    />,
  );

  // initially closed
  expect(screen.queryByRole("button", { name: "Leaderboard" })).toBeNull();

  // open sandwich menu
  const toggleButton = screen.getByRole("button", {
    name: "Toggle Sandwich",
  });
  await user.press(toggleButton);

  // verify leaderboard appears
  const leaderboardButton = screen.getByRole("button", {
    name: "Leaderboard",
  });
  expect(leaderboardButton).toBeOnTheScreen();
  await user.press(leaderboardButton);
  expect(onNavigateLeaderboard).toHaveBeenCalledTimes(1);

  // verify menu closes after navigation
  expect(screen.queryByRole("button", { name: "Leaderboard" })).toBeNull();
});
