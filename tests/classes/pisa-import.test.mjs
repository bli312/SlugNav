import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { savePisaClasses } from "../../src/components/classes/pisa/SavePisaClasses.ts";

const sample = {
  code: "TEST 100 - 01",
  name: "Sample class",
  number: 12345,
  meetingInfo: { location: "Room 12", dayAndTime: "MWF 9:00AM-10:00AM" },
  instructor: { name: "Staff" },
};

function clientWith(fetch) {
  return createClient("https://example.supabase.co", "sb_secret_test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  });
}

test("PISA imports send parsed meetings and raw text to the catalog import function", async () => {
  let sent;
  const client = clientWith(async (input, options) => {
    const url = new URL(input);
    assert.equal(url.pathname, "/rest/v1/rpc/import_pisa_classes");
    assert.equal(options.method, "POST");
    sent = JSON.parse(options.body);
    return new Response(null, { status: 201 });
  });
  const result = await savePisaClasses(client, [sample], 2268);
  assert.equal(sent.p_term, 2268);
  const [row] = sent.p_classes;
  assert.deepEqual(row, {
    code: sample.code,
    name: sample.name,
    class_number: sample.number,
    location: sample.meetingInfo.location,
    day_and_time: sample.meetingInfo.dayAndTime,
    instructor_name: sample.instructor.name,
    meetings: [
      {
        days_of_week: [1, 3, 5],
        start_time: "09:00",
        end_time: "10:00",
        location_text: sample.meetingInfo.location,
      },
    ],
  });
  assert.deepEqual(result.formattedClasses, sent.p_classes);
  assert.equal(result.error, null);
});

test("PISA imports report Supabase failures to the caller", async () => {
  const client = clientWith(async () =>
    Response.json(
      { message: "Synthetic import failure", code: "23514" },
      { status: 400 },
    ),
  );
  const { error } = await savePisaClasses(client, [sample], 2268);
  assert.equal(error.message, "Synthetic import failure");
  assert.equal(error.code, "23514");
});

test("empty PISA results cannot report a successful import", async () => {
  const client = clientWith(async () =>
    assert.fail("Empty results must not be sent"),
  );
  await assert.rejects(
    savePisaClasses(client, [], 2268),
    /PISA returned no classes/,
  );
});

test("missing PISA identifiers cannot create catalog rows without an import key", async () => {
  const client = clientWith(async () =>
    assert.fail("Invalid data must not be sent"),
  );
  for (const [term, number] of [
    [NaN, 12345],
    [-1, 12345],
    [2268, NaN],
    [2268, 0],
  ]) {
    await assert.rejects(
      savePisaClasses(client, [{ ...sample, number }], term),
      /positive integers/,
    );
  }
});
