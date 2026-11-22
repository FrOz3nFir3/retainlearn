import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey, daysBetween, daysSince, isTimeZone } from "@retainlearn/core";

test("a day turns over at midnight where the player is, not in UTC", () => {
  assert.equal(dayKey(new Date("2026-11-20T18:29:59Z"), "Asia/Kolkata"), "2026-11-20"); // 23:59:59 in India
  assert.equal(dayKey(new Date("2026-11-20T18:30:00Z"), "Asia/Kolkata"), "2026-11-21"); // midnight in India
  assert.equal(dayKey(new Date("2026-11-21T07:59:00Z"), "America/Los_Angeles"), "2026-11-20"); // 23:59 in Los Angeles
  assert.equal(dayKey(new Date("2026-11-20T18:30:00Z")), "2026-11-20", "UTC when no time zone is given");
});

test("a moment can come from the database or from JSON", () => {
  assert.equal(dayKey("2026-11-20T18:30:00.000Z", "Asia/Kolkata"), "2026-11-21");
  assert.equal(dayKey(Date.parse("2026-11-20T18:30:00Z"), "Asia/Kolkata"), "2026-11-21");
  assert.throws(() => dayKey("not a date", "Asia/Kolkata"), RangeError);
});

test("days between two days follow the calendar: months, years, leap days and daylight saving", () => {
  assert.equal(daysBetween("2026-11-20", "2026-11-23"), 3);
  assert.equal(daysBetween("2026-11-23", "2026-11-20"), -3);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2028-02-28", "2028-03-01"), 2); // 2028 is a leap year
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2); // Europe's clocks go forward on the 29th
});

test("days since a moment count from the day it fell on, where the player is", () => {
  const at = new Date("2026-11-20T19:00:00Z"); // 00:30 on the 21st in India, 19:00 on the 20th in UTC
  assert.equal(daysSince(at, { today: "2026-11-21", timeZone: "Asia/Kolkata" }), 0);
  assert.equal(daysSince(at, { today: "2026-11-21", timeZone: "UTC" }), 1);
  assert.equal(daysSince(at, { today: "2026-11-21" }), 1, "UTC when no time zone is given");
});

test("only time zones this machine knows are accepted", () => {
  for (const zone of ["Asia/Kolkata", "America/New_York", "Europe/London", "UTC"]) assert.equal(isTimeZone(zone), true, zone);
  for (const bad of ["Mars/Olympus_Mons", "", " ", "x".repeat(65), null, undefined, 42, {}]) {
    assert.equal(isTimeZone(bad), false, String(bad));
  }
  assert.throws(() => dayKey(new Date(), "Mars/Olympus_Mons"), RangeError);
});
