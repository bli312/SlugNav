import React from "react";
import { expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";

import FeedbackReportsRoute from "../../src/app/feedback-reports";

// Renders the screen's header button the way the navigator would.
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: {
    Screen: ({
      options,
    }: {
      options: { headerRight?: () => React.ReactNode };
    }) => <>{options.headerRight?.()}</>,
  },
}));
jest.mock("@/components/places/FeedbackReportsScreen", () => () => null);

test("US-4.1-T-1 Feedback and Reports has a My photos button that opens My photos", async () => {
  const user = userEvent.setup();
  await render(<FeedbackReportsRoute />);
  await user.press(screen.getByRole("button", { name: "My photos" }));
  expect(mockPush).toHaveBeenCalledWith("/my-photos");
});
