// Carrying on a class left halfway: only the class asked for, and what was answered before as your progress has it.
// Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dayKey } from "@retainlearn/core";
import type { ClassInProgress, When } from "@retainlearn/core";
import { answeredBefore, carryOn, keyRound } from "./resume.ts";

const TODAY = dayKey(new Date(), "Asia/Kolkata");
const when: When = { today: TODAY, timeZone: "Asia/Kolkata" };
const left = (over: Partial<ClassInProgress> = {}): ClassInProgress => ({ key: "quiz:1:abc", mode: "quiz", day: TODAY, seq: 2, ids: ["a", "b", "c"], index: 1, ...over });

test("a class's key says its round, a mixed quiz, or picked items", () => {
  assert.equal(keyRound(3), "3");
  assert.equal(keyRound(null, true), "mix");
  assert.equal(keyRound(null), "pick");
});

test("round 1 left halfway carries on when round 1 is asked for, with where it stopped", () => {
  assert.deepEqual(carryOn(left(), "quiz", TODAY, { round: "1", ids: null })?.index, 1);
});

test("another round, another kind of class, or another day starts afresh", () => {
  assert.equal(carryOn(left(), "quiz", TODAY, { round: "3", ids: null }), null);
  assert.equal(carryOn(left(), "retryMissed", TODAY, { round: "1", ids: null }), null);
  assert.equal(carryOn(left({ day: "2000-01-01" }), "quiz", TODAY, { round: "1", ids: null }), null);
  assert.equal(carryOn(left({ key: "quiz:pick:abc" }), "quiz", TODAY, { round: "mix", ids: null }), null);
});

test("picked items carry on only when they're among the ones asked for", () => {
  const retry = left({ key: "retryMissed:pick:abc", mode: "retryMissed", ids: ["a", "b"], index: 1 });
  assert.ok(carryOn(retry, "retryMissed", TODAY, { round: "pick", ids: new Set(["a", "b", "c"]) }));
  assert.equal(carryOn(retry, "retryMissed", TODAY, { round: "pick", ids: new Set(["c", "d"]) }), null);
  assert.ok(carryOn(retry, "retryMissed", TODAY, { round: "pick", ids: null }), "Retry what you missed, with nothing named");
});

test("a class with nothing left to do, or nothing recorded, isn't carried on", () => {
  assert.equal(carryOn(left({ index: 3 }), "quiz", TODAY, { round: "1", ids: null }), null);
  assert.equal(carryOn(left({ ids: [] }), "quiz", TODAY, { round: "1", ids: null }), null);
  assert.equal(carryOn(null, "quiz", TODAY, { round: "1", ids: null }), null);
});

test("what was answered before leaving: missed today, right or seen today, or not known", () => {
  assert.equal(answeredBefore({ missedOn: TODAY, refreshedAt: new Date() }, when), false);
  assert.equal(answeredBefore({ level: 1, refreshedAt: new Date() }, when), true);
  assert.equal(answeredBefore({ seenAt: new Date().toISOString() }, when), true);
  assert.equal(answeredBefore({ level: 2, refreshedAt: "2026-11-01T10:00:00Z" }, when), null);
  assert.equal(answeredBefore(undefined, when), null);
});
