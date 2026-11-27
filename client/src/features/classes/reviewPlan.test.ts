// What a review asks: a round's flashcards you haven't seen (else all of them again), your pick, or going over what
// you missed with only the points you missed. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ProgressView, StudySetContent } from "@retainlearn/core";
import type { RecallPoint } from "./recallPoints.ts";
import { byPoints, planReview } from "./reviewPlan.ts";

const when = { today: "2026-11-24", timeZone: "Asia/Kolkata" };
const point = (key: string): RecallPoint => ({ key, kind: "label", label: key, cue: true, html: `<p>${key}</p>`, section: null, items: 1 });
// Every answer has three recall points, a, b and c, so a round closes at 6 flashcards (18 points, past 16).
const pointsOf = () => [point("a"), point("b"), point("c")];

const set: StudySetContent = {
  _id: "s",
  category: "Programming",
  topic: "JavaScript",
  subtopic: "Basics",
  description: "",
  listed: true,
  version: 1,
  author: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
  reviewers: 0,
  flashcards: Array.from({ length: 10 }, (_, i) => ({ _id: `f${i + 1}`, question: `<p>Flashcard ${i + 1}</p>`, answer: "<ul><li>a</li></ul>" })),
  questions: [],
};
const progress = (flashcards: ProgressView["flashcards"]): ProgressView => ({ setId: "s", flashcards, questions: {}, order: null, quiz: { started: 0, finished: 0 }, classInProgress: null, lastAt: null });
const ids = (plan: { flashcards: { _id: string }[] }) => plan.flashcards.map((c) => c._id);

test("a review is the next round's flashcards you haven't seen, and the whole round again once you've seen them all", () => {
  const first = planReview(set, null, false, when, {}, pointsOf);
  assert.deepEqual([first.title, first.round, ids(first)], ["Round 1 of 2", 1, ["f1", "f2", "f3", "f4", "f5", "f6"]]);
  assert.ok(first.flashcards.every(byPoints), "three points each: reviewed point by point");

  const someSeen = progress({ f1: { seenAt: "2026-11-23T06:00:00Z", missedOn: null }, f2: { seenAt: "2026-11-23T06:00:00Z", missedOn: null } });
  assert.deepEqual(ids(planReview(set, someSeen, false, when, { round: 1 }, pointsOf)), ["f3", "f4", "f5", "f6"]);
  const allSeen = progress(Object.fromEntries(["f1", "f2", "f3", "f4", "f5", "f6"].map((id) => [id, { seenAt: "2026-11-23T06:00:00Z", missedOn: null }])));
  const again = planReview(set, allSeen, false, when, { round: 1 }, pointsOf);
  assert.deepEqual([again.again, ids(again).length], [true, 6]);
});

test("going over what you missed asks only the points you missed last time, on up to four flashcards", () => {
  const missed = progress({
    f2: { seenAt: "2026-11-23T06:00:00Z", missedOn: "2026-11-23", points: [{ key: "a", knew: true, at: "2026-11-23T06:00:00Z" }, { key: "b", knew: false, at: "2026-11-23T06:00:00Z" }] },
    f5: { seenAt: "2026-11-23T06:00:00Z", missedOn: "2026-11-23" },
    f9: { seenAt: "2026-11-23T06:00:00Z", missedOn: null },
  });
  const plan = planReview(set, missed, true, when, {}, pointsOf);
  assert.deepEqual(ids(plan), ["f2", "f5"]);
  assert.deepEqual(plan.flashcards[0]?.points.map((p) => p.key), ["b"], "only the point missed");
  assert.equal(plan.flashcards[0]?.focused, true);
  assert.deepEqual(plan.flashcards[1]?.points.map((p) => p.key), ["a", "b", "c"], "no record of its points: all of them");
});

test("your pick reviews exactly the flashcards you chose, in your order", () => {
  const mine = { ...progress({}), order: ["f7", "f3"] };
  assert.deepEqual(ids(planReview(set, mine, false, when, { picked: new Set(["f3", "f7"]) }, pointsOf)), ["f7", "f3"]);
});

test("a flashcard with fewer than two recall points is reviewed whole", () => {
  const plan = planReview(set, null, false, when, {}, () => [point("only")]);
  assert.equal(byPoints(plan.flashcards[0]!), false);
});

test("a path's step: its flashcards you haven't seen first, a round's worth of points; what you missed kept to it", () => {
  const step = new Set(["f1", "f2", "f3", "f4", "f5", "f6", "f7"]);
  const seen = { seenAt: "2026-11-23T06:00:00Z", missedOn: null, points: [] };
  const plan = planReview(set, progress({ f1: seen, f2: seen }), false, when, { step }, pointsOf);
  assert.deepEqual(
    [plan.title, plan.flashcards.map((c) => c._id), plan.again, plan.picked],
    ["This step", ["f3", "f4", "f5", "f6", "f7"], false, true],
  );
  const allSeen = progress(Object.fromEntries([...step].map((id) => [id, seen])));
  assert.deepEqual(
    planReview(set, allSeen, false, when, { step }, pointsOf).flashcards.map((c) => c._id),
    ["f1", "f2", "f3", "f4", "f5"],
  );
  const missed = { seenAt: "2026-11-23T06:00:00Z", missedOn: "2026-11-23", points: [] };
  assert.deepEqual(
    planReview(set, progress({ f1: missed, f9: missed }), true, when, { step }, pointsOf).flashcards.map((c) => c._id),
    ["f1"],
  );
});
