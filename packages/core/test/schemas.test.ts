import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectIdHex, TimeZone, z } from "@retainlearn/core";

test("an id is 24 hexadecimal digits, as MongoDB's ids travel in URLs and JSON", () => {
  assert.equal(ObjectIdHex.safeParse("6740f1a2b3c4d5e6f7a8b9c0").success, true);
  assert.equal(ObjectIdHex.safeParse("6740F1A2B3C4D5E6F7A8B9C0").success, true);
  for (const bad of ["", "6740f1a2b3c4d5e6f7a8b9c", "6740f1a2b3c4d5e6f7a8b9c0a", "zzzzzzzzzzzzzzzzzzzzzzzz", { $ne: null }, 42]) {
    assert.equal(ObjectIdHex.safeParse(bad).success, false, JSON.stringify(bad));
  }
  assert.equal(ObjectIdHex.safeParse("nope").error?.issues[0]?.message, "must be an id");
});

test("a time zone must be one this machine knows", () => {
  assert.equal(TimeZone.safeParse("Asia/Kolkata").success, true);
  assert.equal(TimeZone.safeParse("Mars/Olympus_Mons").success, false);
  assert.equal(TimeZone.safeParse("Mars/Olympus_Mons").error?.issues[0]?.message, "must be a time zone");
});

test("an object schema keeps only the fields it lists, so a stray field never gets through", () => {
  const Note = z.object({ note: z.string() });
  assert.deepEqual(Note.parse({ note: "hi", role: "admin" }), { note: "hi" });
});
