import React from "react";
import { expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import AccountHeader from "../../src/components/AccountHeader";

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

  expect(screen.getByText("SlugNav")).toBeOnTheScreen();
  expect(screen.getByText("student@ucsc.edu")).toBeOnTheScreen();

  const feedbackBtn = screen.getByRole("button", {
    name: "Feedback and Report",
  });
  const classesBtn = screen.getByRole("button", { name: "Classes" });
  const signOutBtn = screen.getByRole("button", { name: "Sign Out" });

  expect(feedbackBtn).toBeOnTheScreen();
  expect(classesBtn).toBeOnTheScreen();
  expect(signOutBtn).toBeOnTheScreen();

  await user.press(feedbackBtn);
  expect(onNavigateFeedback).toHaveBeenCalledTimes(1);

  await user.press(classesBtn);
  expect(onNavigateClasses).toHaveBeenCalledTimes(1);

  await user.press(signOutBtn);
  expect(onSignOut).toHaveBeenCalledTimes(1);
});
