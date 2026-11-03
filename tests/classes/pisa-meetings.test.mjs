import assert from "node:assert/strict";
import { test } from "node:test";
import * as cheerio from "cheerio";
import { parsePisaMeetings } from "../../src/components/classes/pisa/ParsePisaMeetings.ts";
import scrapeClass from "../../src/components/classes/pisa/ScrapePisaClass.ts";

test("PISA meeting formats become local days and times, with missing details left null", () => {
  for (const [text, days, start, end] of [
    ["MWF 09:20AM-10:25AM", [1, 3, 5], "09:20", "10:25"],
    ["TuThSa 11:40AM-02:05PM", [2, 4, 6], "11:40", "14:05"],
    ["Su 12:00AM-12:00PM", [7], "00:00", "12:00"],
    ["F", [5], null, null],
    ["08:00AM-09:00AM", null, "08:00", "09:00"],
    ["", null, null, null],
  ]) {
    assert.deepEqual(parsePisaMeetings(text, " Room 12 "), [
      {
        days_of_week: days,
        start_time: start,
        end_time: end,
        location_text: "Room 12",
      },
    ]);
  }
  assert.equal(parsePisaMeetings("F", "")[0].location_text, null);
  assert.deepEqual(parsePisaMeetings("", ""), []);
});

test("unrecognized or invalid schedules use the raw-text fallback", () => {
  for (const text of [
    "Cancelled Cancelled",
    "TBA",
    "M 13:00PM-02:00PM",
    "M 09:75AM-10:00AM",
    "M 10:00AM-09:00AM",
    "M 09:00AM-10:00AM\nBy arrangement",
  ]) {
    assert.deepEqual(parsePisaMeetings(text, "Room 12"), [], text);
  }
});

test("scraping preserves separate PISA meeting lines for different days and times", () => {
  const $ = cheerio.load(`<div class="panel panel-default row">
    <h2><a>TEST 100 - 01&nbsp;&nbsp;&nbsp;Sample class</a></h2>
    <div class="panel-body"><div class="row">
      <div><a>12345</a></div><div>Instructor: Staff</div>
      <div><div>Location: Room 12</div>
        <div>Day and Time: Tu 12:00PM-01:00PM<br>&nbsp;&nbsp;Th 11:00AM-01:00PM</div>
      </div>
    </div></div>
  </div>`);
  const item = scrapeClass($, $(".panel")[0]);
  const meetings = parsePisaMeetings(
    item.meetingInfo.dayAndTime,
    item.meetingInfo.location,
  );
  assert.deepEqual(
    meetings.map(({ days_of_week, start_time, end_time }) => [
      days_of_week,
      start_time,
      end_time,
    ]),
    [
      [[2], "12:00", "13:00"],
      [[4], "11:00", "13:00"],
    ],
  );
  assert.ok(meetings.every((meeting) => meeting.location_text === "Room 12"));
});
