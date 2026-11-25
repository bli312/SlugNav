import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildWeeklyReminders,
  getReminderClasses,
} from "../../src/lib/class-reminders.ts";

const course = {
  id: 1,
  code: "CSE 115A",
  name: "Software Engineering",
  class_meetings: [{ id: 10, days_of_week: [1, 3, 5], start_time: "10:00:00" }],
};
test("US-4.2-T-1 AC5: loads all saved classes with an explicit owner filter and pagination", async () => {
  const calls = [];
  const pages = [[{ class: course }], [{ class: { ...course, id: 2 } }], []];
  const client = {
    from(table) {
      const query = {
        select(value) {
          calls.push([table, value]);
          return query;
        },
        eq(key, value) {
          calls.push([key, value]);
          return query;
        },
        order() {
          return query;
        },
        range(start, end) {
          calls.push([start, end]);
          return query;
        },
        overrideTypes: async () => ({ data: pages.shift(), error: null }),
      };
      return query;
    },
  };
  assert.deepEqual(
    (await getReminderClasses(client, "alice")).map((item) => item.id),
    [1, 2],
  );
  assert.ok(calls.filter((call) => call[0] === "user_classes").length === 3);
  assert.equal(
    calls.filter((call) => call[0] === "user_id" && call[1] === "alice").length,
    3,
  );
  assert.deepEqual(
    calls.filter((call) => typeof call[0] === "number").map((call) => call[0]),
    [0, 1, 2],
  );
});
test("US-4.2-T-1 AC5: rejects query failures including failures after an earlier page", async () => {
  let count = 0;
  const query = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    range() {
      return this;
    },
    async overrideTypes() {
      return ++count === 1
        ? { data: [{ class: course }] }
        : { error: new Error("later page failed") };
    },
  };
  await assert.rejects(
    getReminderClasses({ from: () => query }, "alice"),
    /later page failed/,
  );
});
test("US-4.2-T-1 AC6: MWF meetings, separate patterns and duplicate days produce correct stable rules", () => {
  const input = [
    {
      ...course,
      class_meetings: [
        ...course.class_meetings,
        { id: 11, days_of_week: [2, 2, 4], start_time: "14:20" },
      ],
    },
  ];
  const rules = buildWeeklyReminders(input, 30, "alice");
  assert.deepEqual(
    rules.map(({ weekday, hour, minute }) => [weekday, hour, minute]),
    [
      [2, 9, 30],
      [4, 9, 30],
      [6, 9, 30],
      [3, 13, 50],
      [5, 13, 50],
    ],
  );
  assert.equal(new Set(rules.map((r) => r.identifier)).size, 5);
  assert.deepEqual(
    rules.map((r) => r.identifier),
    buildWeeklyReminders(input, 60, "alice").map((r) => r.identifier),
  );
  assert.notDeepEqual(
    rules.map((r) => r.identifier),
    buildWeeklyReminders(input, 30, "bob").map((r) => r.identifier),
  );
});
test("US-4.2-T-1 AC6: subtracts across midnight and week boundaries including large safe offsets", () => {
  const input = [
    {
      ...course,
      class_meetings: [{ id: 1, days_of_week: [1], start_time: "00:15" }],
    },
  ];
  for (const offset of [30, 10080 + 30]) {
    const [rule] = buildWeeklyReminders(input, offset, "alice");
    assert.deepEqual([rule.weekday, rule.hour, rule.minute], [1, 23, 45]);
  }
  const [rule] = buildWeeklyReminders(input, Number.MAX_SAFE_INTEGER, "alice");
  assert.ok(
    rule.weekday >= 1 &&
      rule.weekday <= 7 &&
      rule.hour >= 0 &&
      rule.hour <= 23 &&
      rule.minute >= 0 &&
      rule.minute <= 59,
  );
});
test("US-4.2-T-1 AC7: skips invalid or missing structured data and handles an empty schedule", () => {
  assert.deepEqual(buildWeeklyReminders([], 30, "alice"), []);
  for (const start_time of [
    null,
    "",
    "25:00",
    "10:60",
    "10:00:30",
    "9:00",
    "10 AM",
  ]) {
    assert.deepEqual(
      buildWeeklyReminders(
        [
          {
            ...course,
            class_meetings: [{ id: 1, days_of_week: [1], start_time }],
          },
        ],
        30,
        "alice",
      ),
      [],
    );
  }
  for (const days_of_week of [null, [], [0, 8, 1.5]])
    assert.deepEqual(
      buildWeeklyReminders(
        [
          {
            ...course,
            class_meetings: [{ id: 1, days_of_week, start_time: "10:00" }],
          },
        ],
        30,
        "alice",
      ),
      [],
    );
});
test("US-4.2-T-1 AC8: notification text uses class code or name and singular minutes", () => {
  assert.equal(
    buildWeeklyReminders([course], 30, "alice")[0].body,
    "CSE 115A starts in 30 minutes.",
  );
  const [rule] = buildWeeklyReminders([{ ...course, code: null }], 1, "alice");
  assert.equal(rule.title, "Class reminder");
  assert.equal(rule.body, "Software Engineering starts in 1 minute.");
});
