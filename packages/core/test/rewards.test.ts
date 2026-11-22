import { test } from "node:test";
import assert from "node:assert/strict";
import { XP, currentStreak, knewFlashcard, levelOf, streakAfterClass, xpForFlashcard, xpForQuestion } from "@retainlearn/core";

test("XP: a right answer earns more than a wrong one, and a review earns for the effort, whatever you marked", () => {
  assert.equal(xpForQuestion(true), 12);
  assert.equal(xpForQuestion(false), 3);
  assert.equal(xpForFlashcard(0), 6, "reviewed whole: 4 + 2");
  assert.equal(xpForFlashcard(5), 14, "4 + 2 for each recall point");
  assert.equal(XP.timetableDone, 50);
});

test("a level every 300 XP", () => {
  assert.deepEqual([0, 299, 300, 899, 900].map((xp) => levelOf(xp)), [1, 1, 2, 3, 4]);
});

test("a flashcard counts as known from 80% of its recall points, or as you marked it when reviewed whole", () => {
  const marks = (knew: number, of: number) => Array.from({ length: of }, (_, i) => ({ knew: i < knew }));
  assert.equal(knewFlashcard(marks(4, 5), false), true);
  assert.equal(knewFlashcard(marks(3, 5), true), false, "the recall points decide, not the overall mark");
  assert.equal(knewFlashcard([], true), true);
  assert.equal(knewFlashcard([], false), false);
});

test("the streak: one more for a class the next day, a freeze covers one missed day, otherwise it starts again", () => {
  const s = (count: number, lastDay: string | null, freezes = 0) => ({ count, lastDay, freezes });
  assert.deepEqual(streakAfterClass(s(0, null), "2026-11-22"), { streak: s(1, "2026-11-22"), firstToday: true });
  assert.deepEqual(streakAfterClass(s(4, "2026-11-21"), "2026-11-22"), { streak: s(5, "2026-11-22"), firstToday: true });
  assert.deepEqual(streakAfterClass(s(5, "2026-11-22"), "2026-11-22"), { streak: s(5, "2026-11-22"), firstToday: false }, "a second class the same day");
  assert.deepEqual(streakAfterClass(s(4, "2026-11-20", 1), "2026-11-22"), { streak: s(5, "2026-11-22", 0), firstToday: true }, "a freeze covers the 21st");
  assert.deepEqual(streakAfterClass(s(4, "2026-11-20"), "2026-11-22"), { streak: s(1, "2026-11-22"), firstToday: true }, "no freeze: it starts again");
  assert.deepEqual(streakAfterClass(s(4, "2026-11-18", 3), "2026-11-22"), { streak: s(1, "2026-11-22", 3), firstToday: true }, "a freeze covers one day, not three");
});

test("the streak shown before today's class: kept from yesterday, ended by a missed day with no freeze", () => {
  const s = (lastDay: string | null, freezes = 0) => ({ count: 6, lastDay, freezes });
  assert.equal(currentStreak(s("2026-11-22"), "2026-11-22"), 6);
  assert.equal(currentStreak(s("2026-11-21"), "2026-11-22"), 6);
  assert.equal(currentStreak(s("2026-11-20", 1), "2026-11-22"), 6);
  assert.equal(currentStreak(s("2026-11-20"), "2026-11-22"), 0);
  assert.equal(currentStreak(s(null), "2026-11-22"), 0);
});
