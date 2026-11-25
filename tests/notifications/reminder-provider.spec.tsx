import React from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import { AppState, Platform } from "react-native";
import {
  ReminderProvider,
  useReminders,
} from "../../src/providers/reminder-provider";
import useClasses from "../../src/components/classes/class_list/useClasses";
import * as classesApi from "../../src/components/classes/class_list/GetClasses";
import {
  allowed,
  denied,
  deferred,
  notifications as native,
  pending,
  preferenceClient,
  resetDevice,
} from "./notification-fixtures";

jest.mock(
  "expo-notifications",
  () => jest.requireActual("./notification-fixtures").notifications,
);
let mockUser: string | null = "alice";
let mockAuthLoading = false;
let mockApi: ReturnType<typeof preferenceClient>;
jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    session: mockUser ? { user: { id: mockUser } } : null,
    loading: mockAuthLoading,
  }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => mockApi.client }));
jest.mock("../../src/components/classes/class_list/GetClasses");
let current: ReturnType<typeof useReminders>;
let classActions: ReturnType<typeof useClasses>;
let activate: (state: string) => void;
function Probe() {
  current = useReminders();
  return null;
}
function ClassesProbe() {
  classActions = useClasses(mockUser!);
  return null;
}
function App({ classes = false }) {
  return (
    <ReminderProvider>
      <Probe />
      {classes && <ClassesProbe />}
    </ReminderProvider>
  );
}
async function ready() {
  await waitFor(() => expect(current.loading).toBe(false));
}
async function refresh() {
  await act(async () => {
    await current.refresh();
  });
}
async function save(settings = { enabled: true, minutesBefore: 30 }) {
  await act(async () => {
    await current.saveSettings(settings);
  });
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  resetDevice();
  mockUser = "alice";
  mockAuthLoading = false;
  mockApi = preferenceClient();
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      activate = listener;
      return { remove: jest.fn() };
    });
  jest.mocked(classesApi.getClasses).mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

test("US-4.2-T-1 AC14: a callback retained by an old account cannot disturb the new account", async () => {
  await render(<App />);
  await ready();
  const oldRefresh = current.refresh;
  mockUser = "bob";
  await screen.rerender(<App />);
  await ready();
  mockApi.client.from.mockClear();
  await act(async () => {
    await oldRefresh();
  });
  expect(current.loading).toBe(false);
  expect(current.settings).toEqual({ enabled: false, minutesBefore: 30 });
  expect(mockApi.client.from).not.toHaveBeenCalled();
});

test("US-4.2-T-1 AC11 AC13: returning from the OS permission prompt does not cancel the enabled save", async () => {
  await render(<App />);
  await ready();
  native.getPermissionsAsync.mockResolvedValue({
    ...denied,
    canAskAgain: true,
  });
  const prompt = deferred<typeof allowed>();
  native.requestPermissionsAsync.mockReturnValueOnce(prompt.promise);
  let saving: Promise<unknown>;
  await act(async () => {
    saving = current.saveSettings({ enabled: true, minutesBefore: 30 });
  });
  await waitFor(() =>
    expect(native.requestPermissionsAsync).toHaveBeenCalled(),
  );
  await act(async () => {
    activate("active");
    native.getPermissionsAsync.mockResolvedValue(allowed);
    prompt.resolve(allowed);
    await saving;
  });
  await ready();
  expect(mockApi.rows.get("alice")?.enabled).toBe(true);
  expect(pending.size).toBe(3);
});

test("US-4.2-T-1 AC14: a stalled old-account read cannot delay cleanup or restore old preferences", async () => {
  await render(<App />);
  await ready();
  await save();
  const delayed = deferred<void>();
  const from = mockApi.client.from.getMockImplementation()!;
  mockApi.client.from.mockImplementationOnce((table) => {
    const query = from(table);
    query.maybeSingle = async () => {
      await delayed.promise;
      return { data: { enabled: true, minutes_before: 45 }, error: null };
    };
    return query;
  });
  let reading: Promise<unknown>;
  await act(async () => {
    reading = current.refresh();
  });
  mockUser = "bob";
  await screen.rerender(<App />);
  await waitFor(() => expect(pending.size).toBe(0));
  await act(async () => {
    delayed.resolve();
    await reading;
  });
  await ready();
  expect(current.settings).toEqual({ enabled: false, minutesBefore: 30 });
  expect(pending.size).toBe(0);
});

test("US-4.2-T-1 AC14: a late write cannot apply old-account preferences or rules to a new account", async () => {
  await render(<App />);
  await ready();
  const delayed = deferred<void>();
  const from = mockApi.client.from.getMockImplementation()!;
  mockApi.client.from.mockImplementationOnce((table) => {
    const query = from(table);
    const upsert = query.upsert;
    query.upsert = async (row, options) => {
      await delayed.promise;
      return upsert(row, options);
    };
    return query;
  });
  let saving: Promise<unknown>;
  await act(async () => {
    saving = current.saveSettings({ enabled: true, minutesBefore: 45 });
  });
  mockUser = "bob";
  await screen.rerender(<App />);
  await act(async () => {
    delayed.resolve();
    await saving;
  });
  await ready();
  expect(current.settings).toEqual({ enabled: false, minutesBefore: 30 });
  expect(pending.size).toBe(0);
  expect(mockApi.rows.has("bob")).toBe(false);
});

test("US-4.2-T-1 AC2 AC13: login and activation load remote preferences and schedule, including remote disable", async () => {
  mockApi.rows.set("alice", { enabled: true, minutes_before: 30 });
  await render(<App />);
  await ready();
  expect(pending.size).toBe(3);
  mockApi.rows.set("alice", { enabled: true, minutes_before: 45 });
  await act(async () => activate("active"));
  await ready();
  await waitFor(() => expect([...pending.values()][0].trigger.minute).toBe(15));
  mockApi.rows.set("alice", { enabled: false, minutes_before: 45 });
  await refresh();
  expect(pending.size).toBe(0);
  expect(current.settings?.minutesBefore).toBe(45);
  expect(native.requestPermissionsAsync).not.toHaveBeenCalled();
});

test.each([true, false])(
  "US-4.2-T-1 AC11 AC12: only enabled Save prompts when allowed; denied save retains preferences (canAskAgain %s)",
  async (canAskAgain) => {
    native.getPermissionsAsync.mockResolvedValue({ ...denied, canAskAgain });
    native.requestPermissionsAsync.mockResolvedValue(denied);
    await render(<App />);
    await ready();
    await refresh();
    expect(native.requestPermissionsAsync).not.toHaveBeenCalled();
    await save();
    expect(native.requestPermissionsAsync).toHaveBeenCalledTimes(
      canAskAgain ? 1 : 0,
    );
    expect(mockApi.rows.size).toBe(0);
    expect(pending.size).toBe(0);
    expect(screen.getByText(/phone.*settings/i)).toBeOnTheScreen();
  },
);

test("US-4.2-T-1 AC11: allowed prompt and provisional iOS permission enable weekly reminders", async () => {
  native.getPermissionsAsync.mockResolvedValue({
    ...denied,
    canAskAgain: true,
  });
  await render(<App />);
  await ready();
  await save();
  expect(native.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(pending.size).toBe(3);
  native.getPermissionsAsync.mockResolvedValue({
    ...denied,
    ios: { status: 3 },
  });
  await refresh();
  expect(pending.size).toBe(3);
  expect(current.error).toBeNull();
});

test("US-4.2-T-1 AC14: disabling cancels rules and revoked permission never disables the account preference", async () => {
  await render(<App />);
  await ready();
  await save();
  native.getPermissionsAsync.mockResolvedValue(denied);
  await refresh();
  expect(pending.size).toBe(0);
  expect(mockApi.rows.get("alice").enabled).toBe(true);
  expect(current.error).toMatch(/blocked/i);
  native.getPermissionsAsync.mockResolvedValue(allowed);
  await refresh();
  expect(pending.size).toBe(3);
  await save({ enabled: false, minutesBefore: 45 });
  expect(pending.size).toBe(0);
  expect(mockApi.rows.get("alice").minutes_before).toBe(45);
});

test.each([null, "bob"])(
  "US-4.2-T-1 AC14: session loss or switching to %s clears old reminders and retains preferences",
  async (nextUser) => {
    await render(<App />);
    await ready();
    await save();
    mockUser = nextUser;
    await screen.rerender(<App />);
    await ready();
    await waitFor(() => expect(pending.size).toBe(0));
    expect(mockApi.rows.get("alice").enabled).toBe(true);
  },
);

test("US-4.2-T-1 AC15 AC16: failed reads retain reminders and failed writes preserve settings until retry", async () => {
  await render(<App />);
  await ready();
  await save();
  const original = [...pending.values()];
  mockApi.state.readError = new Error("offline");
  await refresh();
  expect([...pending.values()]).toEqual(original);
  expect(current.error).toMatch(/load/i);
  mockApi.state.readError = null;
  await refresh();
  mockApi.state.classError = new Error("class query failed");
  await refresh();
  expect([...pending.values()]).toEqual(original);
  expect(current.error).toMatch(/update/i);
  mockApi.state.classError = null;
  mockApi.state.writeError = new Error("write failed");
  await save({ enabled: true, minutesBefore: 45 });
  expect([...pending.values()]).toEqual(original);
  expect(current.settings?.minutesBefore).toBe(30);
  expect(current.error).toMatch(/save/i);
  mockApi.state.writeError = null;
  await save({ enabled: true, minutesBefore: 45 });
  expect(current.settings?.minutesBefore).toBe(45);
  expect(pending.size).toBe(3);
  expect(current.error).toBeNull();
});

test("US-4.2-T-1 AC15 AC16: a saved preference with failed scheduling has distinct feedback and retries from Supabase", async () => {
  await render(<App />);
  await ready();
  native.scheduleNotificationAsync.mockRejectedValueOnce(
    new Error("device failed"),
  );
  await save();
  expect(mockApi.rows.get("alice").enabled).toBe(true);
  expect(current.error).toMatch(/settings saved.*reminders/i);
  await refresh();
  expect(pending.size).toBe(3);
  expect(current.error).toBeNull();
});

test("US-4.2-T-1 AC14: a late permission response cannot save or schedule for an old account", async () => {
  await render(<App />);
  await ready();
  native.getPermissionsAsync.mockResolvedValue({
    ...denied,
    canAskAgain: true,
  });
  const prompt = deferred<typeof allowed>();
  native.requestPermissionsAsync.mockReturnValueOnce(prompt.promise);
  let saving: Promise<unknown>;
  await act(async () => {
    saving = current.saveSettings({ enabled: true, minutesBefore: 30 });
  });
  await waitFor(() =>
    expect(native.requestPermissionsAsync).toHaveBeenCalled(),
  );
  mockUser = "bob";
  await screen.rerender(<App />);
  await act(async () => {
    prompt.resolve(allowed);
    await saving;
  });
  await ready();
  expect(mockApi.rows.size).toBe(0);
  expect(pending.size).toBe(0);
});

test("US-4.2-T-1 AC14: logout clears reminders even when an older native registration finishes late", async () => {
  await render(<App />);
  await ready();
  const delayed = deferred<void>();
  const schedule = native.scheduleNotificationAsync.getMockImplementation();
  native.scheduleNotificationAsync.mockImplementationOnce(async (request) => {
    await delayed.promise;
    return schedule(request);
  });
  let saving: Promise<unknown>;
  await act(async () => {
    saving = current.saveSettings({ enabled: true, minutesBefore: 30 });
  });
  await waitFor(() =>
    expect(native.scheduleNotificationAsync).toHaveBeenCalled(),
  );
  mockUser = null;
  await screen.rerender(<App />);
  await act(async () => {
    delayed.resolve();
    await saving;
  });
  await waitFor(() => expect(pending.size).toBe(0));
});

test("US-4.2-T-1 AC14: a newer disable wins over an in-flight scheduling update", async () => {
  await render(<App />);
  await ready();
  await save();
  const delayed = deferred<void>();
  const schedule = native.scheduleNotificationAsync.getMockImplementation();
  native.scheduleNotificationAsync.mockImplementationOnce(async (request) => {
    await delayed.promise;
    return schedule(request);
  });
  mockApi.rows.set("alice", { enabled: true, minutes_before: 45 });
  let refreshing: Promise<unknown>, disabling: Promise<unknown>;
  await act(async () => {
    refreshing = current.refresh();
  });
  await waitFor(() =>
    expect(native.scheduleNotificationAsync).toHaveBeenCalledTimes(4),
  );
  await act(async () => {
    disabling = current.saveSettings({ enabled: false, minutesBefore: 45 });
    delayed.resolve();
    await Promise.all([refreshing, disabling]);
  });
  expect(pending.size).toBe(0);
  expect(mockApi.rows.get("alice").enabled).toBe(false);
});

test("US-4.2-T-1 AC13 AC15: successful class mutations refresh; failed ones do not; reminder errors do not undo classes", async () => {
  await render(<App classes />);
  await ready();
  await save();
  const item = {
    id: "1",
    saved: false,
    ownerId: null,
    meetings: [],
    title: "Class",
  };
  mockApi.client.from.mockClear();
  jest
    .mocked(classesApi.saveClass)
    .mockRejectedValueOnce(new Error("save failed"));
  await act(async () => {
    await classActions.updateClass(item, false);
  });
  expect(mockApi.client.from).not.toHaveBeenCalled();
  mockApi.state.classError = new Error("reminders failed");
  await act(async () => {
    await classActions.updateClass(item, false);
  });
  await waitFor(() => expect(current.error).toMatch(/update/i));
  expect(classActions.error).toBeNull();
  mockApi.state.classError = null;
  mockApi.client.from.mockClear();
  await act(async () => {
    await classActions.updateClass({ ...item, saved: true }, true);
  });
  await waitFor(() => expect(mockApi.client.from).toHaveBeenCalled());
  mockApi.client.from.mockClear();
  jest
    .mocked(classesApi.createManualClass)
    .mockResolvedValue({ ...item, saved: true });
  await act(async () => {
    await classActions.addManualClass({});
  });
  await waitFor(() => expect(mockApi.client.from).toHaveBeenCalled());
  mockApi.client.from.mockClear();
  jest
    .mocked(classesApi.createManualClass)
    .mockRejectedValueOnce(new Error("manual failed"));
  await act(async () => {
    await expect(classActions.addManualClass({})).rejects.toThrow(
      "manual failed",
    );
  });
  expect(mockApi.client.from).not.toHaveBeenCalled();
});
