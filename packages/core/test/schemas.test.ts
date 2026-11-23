import { test } from "node:test";
import assert from "node:assert/strict";
import { ObjectIdHex, SaveAnswers, TimeZone, z } from "@retainlearn/core";

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

test("saving answers: what a batch must hold, with defaults filled in", () => {
  const id = "6740f1a2b3c4d5e6f7a8b9c0";
  const batch = { timeZone: "Asia/Kolkata", classKey: "quiz:round-1", mode: "quiz", seq: 1, answers: [{ kind: "question", itemId: id, correct: true, ms: 4200 }] };
  const parsed = SaveAnswers.parse({ ...batch, answers: [...batch.answers, { kind: "flashcard", itemId: id, knew: true, ms: 9000 }] });
  assert.equal(parsed.finished, false);
  assert.deepEqual(parsed.answers[1], { kind: "flashcard", itemId: id, knew: true, points: [], ms: 9000 });

  const bad = {
    "an unknown kind of class": { ...batch, mode: "battle" },
    "no answers": { ...batch, answers: [] },
    "more than 25 answers": { ...batch, answers: Array(26).fill(batch.answers[0]) },
    "a flashcard marked like a question": { ...batch, answers: [{ kind: "flashcard", itemId: id, correct: true, ms: 1 }] },
    "a negative time": { ...batch, answers: [{ ...batch.answers[0], ms: -1 }] },
    "an item that isn't an id": { ...batch, answers: [{ ...batch.answers[0], itemId: "q1" }] },
    "an unknown time zone": { ...batch, timeZone: "Mars/Olympus_Mons" },
    "a batch number of 0": { ...batch, seq: 0 },
    "more than 30 recall points": { ...batch, answers: [{ kind: "flashcard", itemId: id, knew: true, ms: 1, points: Array.from({ length: 31 }, (_, i) => ({ key: `p${i}`, knew: true })) }] },
    "a recall point's key over 160 characters": { ...batch, answers: [{ kind: "flashcard", itemId: id, knew: true, ms: 1, points: [{ key: "x".repeat(161), knew: true }] }] },
  };
  for (const [what, body] of Object.entries(bad)) assert.equal(SaveAnswers.safeParse(body).success, false, what);
});
