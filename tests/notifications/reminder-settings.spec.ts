import { expect, test } from "@jest/globals";
import {
  readReminderSettings,
  writeReminderSettings,
} from "../../src/lib/reminder-settings";
import { preferenceClient } from "./notification-fixtures";

test("US-4.2-T-1 AC1: missing preferences default to off and 30 without inserting", async () => {
  const api = preferenceClient();
  expect(await readReminderSettings(api.client, "alice")).toEqual({
    enabled: false,
    minutesBefore: 30,
  });
  expect(api.rows.size).toBe(0);
  expect(api.requests).toEqual([
    expect.objectContaining({
      table: "notification_preferences",
      filters: [["user_id", "alice"]],
    }),
  ]);
});

test("US-4.2-T-1 AC2: upserts account preferences and another client reads them", async () => {
  const api = preferenceClient();
  const other = preferenceClient(api.rows);
  await writeReminderSettings(api.client, "alice", {
    enabled: true,
    minutesBefore: 45,
  });
  expect(api.rows.get("alice")).toEqual({
    user_id: "alice",
    enabled: true,
    minutes_before: 45,
  });
  expect(api.requests[0].options).toEqual({ onConflict: "user_id" });
  expect(await readReminderSettings(other.client, "alice")).toEqual({
    enabled: true,
    minutesBefore: 45,
  });
  expect(await readReminderSettings(other.client, "bob")).toEqual({
    enabled: false,
    minutesBefore: 30,
  });
  await writeReminderSettings(other.client, "alice", {
    enabled: false,
    minutesBefore: 15,
  });
  expect(await readReminderSettings(api.client, "alice")).toEqual({
    enabled: false,
    minutesBefore: 15,
  });
});

test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "30", null])(
  "US-4.2-T-1 AC4: rejects invalid lead time %s before a database request",
  async (minutesBefore) => {
    const api = preferenceClient();
    await expect(
      writeReminderSettings(api.client, "alice", {
        enabled: true,
        minutesBefore,
      }),
    ).rejects.toThrow();
    expect(api.requests).toHaveLength(0);
  },
);

test("US-4.2-T-1 AC15: rejects failed reads, writes and malformed responses", async () => {
  const api = preferenceClient();
  api.state.readError = new Error("read failure");
  await expect(readReminderSettings(api.client, "alice")).rejects.toThrow(
    "read failure",
  );
  api.state.readError = null;
  for (const row of [
    {},
    { enabled: "yes", minutes_before: 30 },
    { enabled: true, minutes_before: -1 },
  ]) {
    api.rows.set("alice", row);
    await expect(readReminderSettings(api.client, "alice")).rejects.toThrow();
  }
  api.state.writeError = new Error("write failure");
  await expect(
    writeReminderSettings(api.client, "alice", {
      enabled: false,
      minutesBefore: 30,
    }),
  ).rejects.toThrow("write failure");
});

test.each([false, 0, ""])(
  "US-4.2-T-1 AC15: a malformed response %s is not treated as a missing row",
  async (data) => {
    const api = preferenceClient();
    const from = api.client.from.getMockImplementation()!;
    api.client.from.mockImplementationOnce((table) => {
      const query = from(table);
      query.maybeSingle = async () => ({ data, error: null });
      return query;
    });
    await expect(readReminderSettings(api.client, "alice")).rejects.toThrow();
  },
);
