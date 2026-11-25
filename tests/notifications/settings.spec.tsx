import React from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { AppState, Platform } from "react-native";
import SettingsRoute from "../../src/app/settings";
import Home from "../../src/app/index";
import RootLayout from "../../src/app/_layout";
import { ReminderProvider } from "../../src/providers/reminder-provider";
import {
  notifications as native,
  pending,
  preferenceClient,
  resetDevice,
} from "./notification-fixtures";

jest.mock(
  "expo-notifications",
  () => jest.requireActual("./notification-fixtures").notifications,
);
// Jest does not supply this Fabric host component; keep the real Switch wrapper.
jest.mock(
  "react-native/Libraries/Components/Switch/SwitchNativeComponent",
  () => ({
    __esModule: true,
    default: "RCTSwitch",
    Commands: { setValue: jest.fn() },
  }),
);
let mockApi: ReturnType<typeof preferenceClient>;
let mockUser: string | null = "alice";
const mockPush = jest.fn();
jest.mock("@/lib/supabase", () => ({ getSupabase: () => mockApi.client }));
jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    session: mockUser
      ? { user: { id: mockUser, email: "student@ucsc.edu" } }
      : null,
    loading: false,
    busy: false,
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock("@/hooks/use-supabase-auto-refresh", () => ({
  useSupabaseAutoRefresh: jest.fn(),
}));
jest.mock("@/components/search/CampusSearch", () => () => null);
jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  const Stack = ({ children }: React.PropsWithChildren) => children;
  Stack.Protected = ({
    guard,
    children,
  }: React.PropsWithChildren<{ guard: boolean }>) => (guard ? children : null);
  Stack.Screen = ({ name }: { name?: string }) =>
    name ? React.createElement(Text, null, `route:${name}`) : null;
  return { Stack, useRouter: () => ({ push: mockPush }) };
});
function App() {
  return (
    <ReminderProvider>
      <SettingsRoute />
    </ReminderProvider>
  );
}
async function ready() {
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save settings" })).toBeEnabled(),
  );
}
async function setMinutes(text: string) {
  await fireEvent.changeText(
    screen.getByLabelText("Minutes before class"),
    text,
  );
}
async function toggle(value: boolean) {
  await fireEvent(
    screen.getByRole("switch", { name: "Notifications" }),
    "valueChange",
    value,
  );
}
async function save() {
  await userEvent
    .setup()
    .press(screen.getByRole("button", { name: "Save settings" }));
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  resetDevice();
  jest
    .spyOn(AppState, "addEventListener")
    .mockReturnValue({ remove: jest.fn() });
  mockApi = preferenceClient();
  mockUser = "alice";
});
afterEach(() => jest.restoreAllMocks());

test("US-4.2-T-1 AC1: home navigation opens Settings and the route is protected by authentication", async () => {
  await render(
    <ReminderProvider>
      <Home />
    </ReminderProvider>,
  );
  const user = userEvent.setup();
  // open sandwich menu first to render button!
  await user.press(
    screen.getByRole("button", { name: "Toggle Sandwich" }),
  );
  await userEvent.press(
    screen.getByRole("button", { name: "Settings" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/settings");
  await screen.unmount();
  await render(<RootLayout />);
  expect(screen.getByText("route:settings")).toBeOnTheScreen();
  mockUser = null;
  await screen.rerender(<RootLayout />);
  expect(screen.queryByText("route:settings")).not.toBeOnTheScreen();
});
test("US-4.2-T-1 AC1 AC2: defaults, explicit Save, persisted values and reopening", async () => {
  await render(<App />);
  await ready();
  expect(
    screen.getByRole("switch", { name: "Notifications" }),
  ).not.toBeChecked();
  expect(screen.getByLabelText("Minutes before class")).toHaveDisplayValue(
    "30",
  );
  await toggle(true);
  await setMinutes("45");
  expect(mockApi.rows.size).toBe(0);
  expect(pending.size).toBe(0);
  await save();
  await waitFor(() => expect(pending.size).toBe(3));
  await screen.unmount();
  await render(<App />);
  await ready();
  expect(screen.getByRole("switch", { name: "Notifications" })).toBeChecked();
  expect(screen.getByLabelText("Minutes before class")).toHaveDisplayValue(
    "45",
  );
  await toggle(false);
  await save();
  expect(pending.size).toBe(0);
  expect(mockApi.rows.get("alice")).toEqual({
    user_id: "alice",
    enabled: false,
    minutes_before: 45,
  });
});
test.each(["", "abc", "1.5", "0", "-1", "9007199254740992"])(
  "US-4.2-T-1 AC4: invalid input %s leaves saved preferences and reminders unchanged",
  async (text) => {
    mockApi.rows.set("alice", {
      user_id: "alice",
      enabled: true,
      minutes_before: 30,
    });
    await render(<App />);
    await ready();
    const before = [...pending.values()];
    await setMinutes(text);
    await save();
    expect(screen.getByRole("alert")).toHaveTextContent(/whole number/i);
    expect(mockApi.rows.get("alice").minutes_before).toBe(30);
    expect([...pending.values()]).toEqual(before);
  },
);
test("US-4.2-T-1 AC15 AC16: a failed load disables Save until Retry succeeds", async () => {
  mockApi.state.readError = new Error("offline");
  await render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/load/i);
  expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
  mockApi.state.readError = null;
  await userEvent.setup().press(screen.getByRole("button", { name: "Retry" }));
  await ready();
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
});
test("US-4.2-T-1 AC15 AC16: failed Save preserves the form and successful resubmission applies it", async () => {
  await render(<App />);
  await ready();
  await toggle(true);
  await setMinutes("45");
  mockApi.state.writeError = new Error("offline");
  await save();
  expect(screen.getByRole("alert")).toHaveTextContent(/save/i);
  expect(screen.getByLabelText("Minutes before class")).toHaveDisplayValue(
    "45",
  );
  expect(screen.getByRole("switch", { name: "Notifications" })).toBeChecked();
  expect(pending.size).toBe(0);
  mockApi.state.writeError = null;
  await save();
  expect(pending.size).toBe(3);
});
test("US-4.2-T-1 AC15 AC16: foreground refresh preserves failed-save inputs for resubmission", async () => {
  await render(<App />);
  await ready();
  await toggle(true);
  await setMinutes("45");
  mockApi.state.writeError = new Error("offline");
  await save();
  const activate = jest.mocked(AppState.addEventListener).mock.calls[0][1];
  await act(async () => activate("active"));
  await ready();
  expect(screen.getByLabelText("Minutes before class")).toHaveDisplayValue(
    "45",
  );
  expect(screen.getByRole("switch", { name: "Notifications" })).toBeChecked();
  expect(mockApi.rows.size).toBe(0);
  expect(pending.size).toBe(0);
  mockApi.state.writeError = null;
  await save();
  expect(mockApi.rows.get("alice")).toEqual({
    user_id: "alice",
    enabled: true,
    minutes_before: 45,
  });
  expect(pending.size).toBe(3);
});
test("US-4.2-T-1 AC2 AC14: switching accounts replaces the previous account's unsaved form", async () => {
  await render(<App />);
  await ready();
  await toggle(true);
  await setMinutes("45");
  mockApi.rows.set("bob", {
    user_id: "bob",
    enabled: false,
    minutes_before: 10,
  });
  mockUser = "bob";
  await screen.rerender(<App />);
  await ready();
  expect(screen.getByLabelText("Minutes before class")).toHaveDisplayValue(
    "10",
  );
  expect(
    screen.getByRole("switch", { name: "Notifications" }),
  ).not.toBeChecked();
  expect(mockApi.rows.has("alice")).toBe(false);
});
test("US-4.2-T-1 AC15 AC16: device failure distinguishes saved settings and Retry recovers", async () => {
  await render(<App />);
  await ready();
  await toggle(true);
  native.scheduleNotificationAsync.mockRejectedValueOnce(new Error("failed"));
  await save();
  expect(screen.getByRole("alert")).toHaveTextContent(
    /settings saved.*reminders/i,
  );
  await userEvent.setup().press(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(pending.size).toBe(3));
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
});
test("US-4.2-T-1 AC17: web explains native-only support and never invokes notification APIs", async () => {
  jest.replaceProperty(Platform, "OS", "web");
  await render(<App />);
  expect(screen.getByText(/available on iOS and Android/i)).toBeOnTheScreen();
  expect(screen.getByRole("switch", { name: "Notifications" })).toBeDisabled();
  expect(screen.getByLabelText("Minutes before class")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Save settings" })).toBeDisabled();
  await act(async () => {});
  for (const fn of [
    native.getPermissionsAsync,
    native.requestPermissionsAsync,
    native.scheduleNotificationAsync,
    native.cancelScheduledNotificationAsync,
    native.getAllScheduledNotificationsAsync,
  ])
    expect(fn).not.toHaveBeenCalled();
});
