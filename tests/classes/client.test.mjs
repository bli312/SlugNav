import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";

import {
  createManualClass,
  getClasses,
  removeClass,
  saveClass,
} from "../../src/components/classes/class_list/GetClasses.ts";
import {
  emptyManualClass,
  manualClassInput,
} from "../../src/components/classes/class_list/manualClass.ts";

function clientWith(fetch) {
  return createClient("https://example.supabase.co", "sb_publishable_test", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch },
  });
}

function row(overrides = {}) {
  return {
    id: 1,
    owner_id: null,
    code: "CSE 115A - 02",
    name: "Software Engineering",
    instructor_name: null,
    location: null,
    day_and_time: null,
    class_meetings: [
      {
        id: 1,
        days_of_week: [1, 3],
        start_time: "09:30:00",
        end_time: "10:45:00",
        location_text: "Room 12",
      },
    ],
    user_classes: [],
    ...overrides,
  };
}

test("loading classes restores saved status and meeting details from the database response", async () => {
  const client = clientWith(async (input) => {
    const url = new URL(input);
    assert.equal(url.pathname, "/rest/v1/classes");
    assert.match(
      url.searchParams.get("select"),
      /code,name,instructor_name,location,day_and_time/,
    );
    assert.equal(url.searchParams.get("order"), "code.asc,id.asc");
    assert.match(url.searchParams.get("select"), /class_meetings\(/);
    assert.match(url.searchParams.get("select"), /user_classes\(user_id\)/);
    if (Number(url.searchParams.get("offset")) > 0) return Response.json([]);
    return Response.json([
      row({
        user_classes: [{ user_id: "student" }],
        location: "Old location",
        day_and_time: "Old meeting text",
      }),
      row({ id: 2 }),
    ]);
  });
  const classes = await getClasses(client);
  assert.equal(classes[0].saved, true);
  assert.equal(classes[0].courseCode, "CSE 115A - 02");
  assert.equal(classes[0].title, "Software Engineering");
  assert.equal(classes[1].saved, false);
  assert.deepEqual(classes[0].meetings, [
    { days: "Mon, Wed", time: "09:30–10:45", location: "Room 12" },
  ]);
});

test("loading a large catalog retains saved catalog and manual classes beyond the first page", async () => {
  const records = Array.from({ length: 1001 }, (_, i) => row({ id: i + 1 }));
  records[1000].user_classes = [{ user_id: "student" }];
  records.push(
    row({
      id: 1002,
      owner_id: "student",
      code: null,
      name: "My manual class",
      user_classes: [{ user_id: "student" }],
    }),
  );
  for (const serverLimit of [1000, 100]) {
    const client = clientWith(async (input) => {
      const url = new URL(input);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Math.min(
        Number(url.searchParams.get("limit") ?? serverLimit),
        serverLimit,
      );
      return Response.json(records.slice(offset, offset + limit));
    });
    const classes = await getClasses(client);
    assert.equal(classes.length, records.length);
    assert.deepEqual(
      classes.filter((item) => item.saved).map((item) => item.id),
      ["1001", "1002"],
    );
    assert.equal(classes.at(-1).title, "My manual class");
  }
});

test("raw PISA location and day/time text remain visible when there are no structured meetings", async () => {
  const client = clientWith(async (input) =>
    Response.json(
      Number(new URL(input).searchParams.get("offset")) > 0
        ? []
        : [
            row({
              class_meetings: [],
              day_and_time: "MWF 9:20AM-10:25AM",
              location: "Test Building 12",
            }),
          ],
    ),
  );
  assert.deepEqual((await getClasses(client))[0].meetings, [
    { days: null, time: "MWF 9:20AM-10:25AM", location: "Test Building 12" },
  ]);
});

test("save requests use the student's association and ignore duplicate conflicts", async () => {
  const client = clientWith(async (input, options) => {
    assert.equal(new URL(input).pathname, "/rest/v1/user_classes");
    assert.equal(
      new URL(input).searchParams.get("on_conflict"),
      "user_id,class_id",
    );
    assert.match(
      new Headers(options.headers).get("Prefer"),
      /resolution=ignore-duplicates/,
    );
    assert.deepEqual(JSON.parse(options.body), {
      user_id: "student",
      class_id: "1",
    });
    return new Response(null, { status: 201 });
  });
  await saveClass(client, "student", "1");
});

test("removal targets a saved association for catalog classes and the owned record for manual classes", async () => {
  const calls = [];
  const client = clientWith(async (input, options) => {
    assert.equal(options.method, "DELETE");
    calls.push(new URL(input));
    return new Response(null, { status: 204 });
  });
  await removeClass(client, "student", { id: "1", ownerId: null });
  await removeClass(client, "student", { id: "2", ownerId: "student" });
  assert.equal(calls[0].pathname, "/rest/v1/user_classes");
  assert.equal(calls[0].searchParams.get("user_id"), "eq.student");
  assert.equal(calls[0].searchParams.get("class_id"), "eq.1");
  assert.equal(calls[1].pathname, "/rest/v1/classes");
  assert.equal(calls[1].searchParams.get("owner_id"), "eq.student");
  assert.equal(calls[1].searchParams.get("id"), "eq.2");
});

test("manual creation makes one transactional RPC and returns the saved class", async () => {
  let calls = 0;
  const draft = { ...emptyManualClass(), title: " My class " };
  const client = clientWith(async (input, options) => {
    calls++;
    assert.equal(new URL(input).pathname, "/rest/v1/rpc/create_manual_class");
    assert.deepEqual(JSON.parse(options.body), {
      p_name: "My class",
      p_code: null,
      p_instructor_name: null,
      p_meetings: [],
    });
    return Response.json(
      row({
        owner_id: "student",
        name: "My class",
        user_classes: [{ user_id: "student" }],
        class_meetings: [],
      }),
    );
  });
  const created = await createManualClass(client, draft);
  assert.equal(created.saved, true);
  assert.equal(created.ownerId, "student");
  assert.equal(created.title, "My class");
  assert.equal(calls, 1);
});

test("failed saves reject without changing the supplied manual form values", async () => {
  const draft = { ...emptyManualClass(), title: "Unsaved class" };
  const original = structuredClone(draft);
  const client = clientWith(async () =>
    Response.json(
      { message: "Permission denied", code: "42501" },
      { status: 403 },
    ),
  );
  await assert.rejects(saveClass(client, "student", "1"), { code: "42501" });
  await assert.rejects(createManualClass(client, draft), { code: "42501" });
  assert.deepEqual(draft, original);
});

test("manual validation rejects blank names, invalid times, and reversed or equal times", () => {
  for (const title of ["", "  \t\n"]) {
    assert.throws(
      () => manualClassInput({ ...emptyManualClass(), title }),
      /class name/,
    );
  }
  for (const [startTime, endTime] of [
    ["25:00", ""],
    ["09:70", ""],
    ["2", ""],
    ["2:5 PM", ""],
    ["13:00 PM", ""],
    ["0:30 AM", ""],
    ["", "2:60 PM"],
    ["14:00", "13:00"],
    ["09:00", "09:00"],
    ["2:00 PM", "1:00 PM"],
    ["9:00 AM", "09:00"],
  ]) {
    const draft = {
      ...emptyManualClass(),
      title: "Class",
      meetings: [{ days: [], startTime, endTime, location: "" }],
    };
    assert.throws(() => manualClassInput(draft), /time/);
  }
});

test("manual times accept unpadded hours and AM/PM and normalize before comparing", () => {
  for (const [startTime, endTime, expectedStart, expectedEnd] of [
    ["2:00", "3:00", "02:00", "03:00"],
    [" 9:30 AM ", "2:00pm", "09:30", "14:00"],
    ["12:00 am", "12:00 PM", "00:00", "12:00"],
    ["2pm", "3pm", "14:00", "15:00"],
    ["14:00", "23:59", "14:00", "23:59"],
  ]) {
    const input = manualClassInput({
      ...emptyManualClass(),
      title: "Class",
      meetings: [{ days: [], startTime, endTime, location: "" }],
    });
    assert.equal(input.p_meetings[0].start_time, expectedStart);
    assert.equal(input.p_meetings[0].end_time, expectedEnd);
  }
});

test("optional details stay optional and supplied meeting details are normalized", () => {
  assert.deepEqual(
    manualClassInput({ ...emptyManualClass(), title: " Class " }),
    {
      p_name: "Class",
      p_code: null,
      p_instructor_name: null,
      p_meetings: [],
    },
  );
  const draft = {
    title: " Class ",
    courseCode: " CSE 115A - 02 ",
    instructor: " Staff ",
    meetings: [
      { days: [3, 1], startTime: " 09:30 ", endTime: "", location: " Online " },
    ],
  };
  assert.deepEqual(manualClassInput(draft), {
    p_name: "Class",
    p_code: "CSE 115A - 02",
    p_instructor_name: "Staff",
    p_meetings: [
      {
        days_of_week: [1, 3],
        start_time: "09:30",
        end_time: null,
        location_text: "Online",
      },
    ],
  });
});
