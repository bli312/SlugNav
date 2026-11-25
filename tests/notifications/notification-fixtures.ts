import { jest } from "@jest/globals";
import type { ReminderClass } from "../../src/lib/class-reminders";

export type NativeRequest = {
  identifier: string;
  content: { title?: string; body?: string; sound?: string };
  trigger: null | {
    type?: string;
    weekday?: number;
    hour?: number;
    minute?: number;
    repeats?: boolean;
    channelId?: string;
    dateComponents?: { weekday?: number; hour?: number; minute?: number };
  };
};
type PreferenceRow = {
  user_id?: string;
  enabled?: unknown;
  minutes_before?: unknown;
};
type Request = {
  table: string;
  filters: [string, string][];
  start: number;
  end: number;
  row?: PreferenceRow;
  options?: unknown;
};
type Query = {
  select: () => Query;
  eq: (key: string, value: string) => Query;
  order: () => Query;
  range: (start: number, end: number) => Query;
  overrideTypes: () => Promise<unknown>;
  maybeSingle: () => Promise<unknown>;
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
  upsert: (
    row: PreferenceRow & { user_id: string },
    options: unknown,
  ) => Promise<unknown>;
};

export const allowed = { granted: true, canAskAgain: true, status: "granted" };
export const denied = { granted: false, canAskAgain: false, status: "denied" };
export const pending = new Map<string, NativeRequest>();
export const notifications = {
  AndroidImportance: { HIGH: 4 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { WEEKLY: "weekly" },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
};

export function resetDevice() {
  pending.clear();
  notifications.getPermissionsAsync.mockResolvedValue(allowed);
  notifications.requestPermissionsAsync.mockResolvedValue(allowed);
  notifications.setNotificationChannelAsync.mockResolvedValue(null);
  notifications.getAllScheduledNotificationsAsync.mockImplementation(
    async () => [...pending.values()],
  );
  notifications.scheduleNotificationAsync.mockImplementation(
    async (request: NativeRequest) => {
      pending.set(request.identifier, request);
      return request.identifier;
    },
  );
  notifications.cancelScheduledNotificationAsync.mockImplementation(
    async (id: string) => {
      pending.delete(id);
    },
  );
}

export const sampleClass = {
  id: 1,
  code: "CSE 115A",
  name: "Software Engineering",
  class_meetings: [{ id: 11, days_of_week: [1, 3, 5], start_time: "10:00:00" }],
};

// A network boundary, shared between independent clients to simulate account storage.
export function preferenceClient(rows = new Map<string, PreferenceRow>()) {
  const requests: Request[] = [];
  const state = {
    readError: null as unknown,
    writeError: null as unknown,
    classError: null as unknown,
  };
  const classes = new Map<string, ReminderClass[]>([
    ["alice", [sampleClass]],
    ["bob", []],
  ]);
  const client = {
    from: jest.fn((table: string) => {
      const request: Request = { table, filters: [], start: 0, end: 499 };
      requests.push(request);
      const result = () => {
        const id =
          request.filters.find(([key]) => key === "user_id")?.[1] ?? "";
        if (table === "notification_preferences")
          return { data: rows.get(id) ?? null, error: state.readError };
        return {
          data: (classes.get(id) ?? [])
            .slice(request.start, request.end + 1)
            .map((item) => ({ class: item })),
          error: state.classError,
        };
      };
      const query: Query = {
        select: jest.fn(() => query),
        eq: jest.fn((key: string, value: string) => {
          request.filters.push([key, value]);
          return query;
        }),
        order: jest.fn(() => query),
        range: jest.fn((start: number, end: number) => {
          Object.assign(request, { start, end });
          return query;
        }),
        overrideTypes: jest.fn(async () => result()),
        maybeSingle: jest.fn(async () => result()),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(result()).then(resolve),
        upsert: jest.fn(
          async (
            row: PreferenceRow & { user_id: string },
            options: unknown,
          ) => {
            Object.assign(request, { row, options });
            if (!state.writeError) rows.set(row.user_id, row);
            return { error: state.writeError };
          },
        ),
      };
      return query;
    }),
  };
  return { client, rows, requests, state, classes };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
