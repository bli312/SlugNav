import assert from "node:assert/strict";
import { test } from "node:test";
import * as cheerio from "cheerio";
import { parsePisaMeetings } from "../../src/components/classes/pisa/ParsePisaMeetings.ts";
import scrapeClass from "../../src/components/classes/pisa/ScrapePisaClass.ts";

test("PISA weekdays and AM/PM times become structured local meeting times", () => {
  for (const [text, days, start, end] of [
    ["MWF 09:20AM-10:25AM", [1, 3, 5], "09:20", "10:25"],
    ["TuThSa 11:40AM-02:05PM", [2, 4, 6], "11:40", "14:05"],
    ["Su 12:00AM-12:00PM", [7], "00:00", "12:00"],
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
});

test("missing PISA days and times stay null", () => {
  assert.deepEqual(parsePisaMeetings("F", ""), [
    {
      days_of_week: [5],
      start_time: null,
      end_time: null,
      location_text: null,
    },
  ]);
  assert.deepEqual(parsePisaMeetings("08:00AM-09:00AM", "Room 12"), [
    {
      days_of_week: null,
      start_time: "08:00",
      end_time: "09:00",
      location_text: "Room 12",
    },
  ]);
  assert.deepEqual(parsePisaMeetings("", "LEC: Online"), [
    {
      days_of_week: null,
      start_time: null,
      end_time: null,
      location_text: "LEC: Online",
    },
  ]);
  assert.deepEqual(parsePisaMeetings("", ""), []);
});

test("unrecognized, invalid, or cancelled schedules are left for raw-text display", () => {
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
  assert.equal(item.number, 12345);
  assert.equal(item.name, "Sample class");
  assert.equal(item.instructor.name, "Staff");
  assert.deepEqual(
    parsePisaMeetings(item.meetingInfo.dayAndTime, item.meetingInfo.location),
    [
      {
        days_of_week: [2],
        start_time: "12:00",
        end_time: "13:00",
        location_text: "Room 12",
      },
      {
        days_of_week: [4],
        start_time: "11:00",
        end_time: "13:00",
        location_text: "Room 12",
      },
    ],
  );
});
