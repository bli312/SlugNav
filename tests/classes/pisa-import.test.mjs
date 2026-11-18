import assert from "node:assert/strict";
import { test } from "node:test";
import { savePisaClasses } from "../../src/components/classes/pisa/SavePisaClasses.ts";

const sample = {
  code: "TEST 100 - 01",
  name: "Sample class",
  number: 12345,
  meetingInfo: { location: "Room 12", dayAndTime: "MWF 9:00AM-10:00AM" },
  instructor: { name: "Staff" },
};

test("PISA imports map scraped fields and meetings to the catalog RPC", async () => {
  const error = { message: "Import failed" };
  const client = {
    async rpc(name, args) {
      assert.equal(name, "import_pisa_classes");
      assert.deepEqual(args, {
        p_term: 2268,
        p_classes: [
          {
            code: sample.code,
            name: sample.name,
            class_number: sample.number,
            location: "Room 12",
            day_and_time: sample.meetingInfo.dayAndTime,
            instructor_name: "Staff",
            meetings: [
              {
                days_of_week: [1, 3, 5],
                start_time: "09:00",
                end_time: "10:00",
                location_text: "Room 12",
              },
            ],
          },
        ],
      });
      return { data: null, error };
    },
  };
  assert.equal((await savePisaClasses(client, [sample], 2268)).error, error);
});

test("empty PISA results fail before calling Supabase", async () => {
  await assert.rejects(
    savePisaClasses({}, [], 2268),
    /PISA returned no classes/,
  );
});
