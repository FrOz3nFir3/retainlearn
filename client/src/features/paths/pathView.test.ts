// A path's page (P2-07): where you are along it from its view, each step's name and counts, what its editors should
// fix, a picked step's own class, and the step a class carries.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { PathStepView, PathView } from "@retainlearn/core";
import { along, fixText, parseStep, pickedClass, stepCounts, stepName, testOutHref } from "./pathView.ts";

const when = { today: "2026-11-27", timeZone: "UTC" };
const PATH = "000000000000000000000001";
const set = (id: string, flashcards: number, questions: number) => ({
  _id: id,
  title: `Set ${id}`,
  category: "Programming",
  flashcards: Array.from({ length: flashcards }, (_, i) => ({ _id: `${id}-f${i + 1}` })),
  questions: Array.from({ length: questions }, (_, i) => ({ _id: `${id}-q${i + 1}`, flashcardId: `${id}-f${(i % Math.max(1, flashcards)) + 1}` })),
});
const step = (id: string, s: ReturnType<typeof set> | null, flashcardIds: string[] | null = null, title = ""): PathStepView => ({
  id,
  setId: s?._id ?? "gone",
  flashcardIds,
  title,
  set: s,
  check: s ? "ok" : "gone",
});
const seen = { seenAt: "2026-11-26T10:00:00Z", missedOn: null };
const view = (steps: PathStepView[], you: Partial<NonNullable<PathView["you"]>> | null = null): PathView => ({
  _id: PATH,
  title: "JS",
  category: "Programming",
  description: "",
  visibility: "public",
  exam: true,
  steps,
  author: null,
  editors: [],
  copiedFrom: null,
  listed: true,
  version: "2026-11-27T00:00:00.000Z",
  you: you ? { canEdit: false, isAuthor: false, following: false, testedOut: [], progress: {}, suggestion: null, skill: null, ...you } : null,
});

test("where you are along a path: done by mastery or a test out, the first not done current, gone steps left out", () => {
  const a = set("a", 2, 0);
  const b = set("b", 2, 0);
  const c = set("c", 2, 2);
  const progress = { a: { flashcards: { "a-f1": seen, "a-f2": seen }, questions: {}, lastAt: "2026-11-26T10:00:00Z" } };
  const path = along(view([step("s1", a), step("s2", b), step("s3", c), step("s4", null)], { progress, testedOut: ["s3"] }), when);
  assert.deepEqual(
    path.steps.map((s) => s.state),
    ["done", "current", "done"],
  );
  assert.equal(path.steps[2]?.testedOut, true);
  assert.equal(along(view([step("s1", a)]), when).current?.step.id, "s1");
});

test("a step's name and counts: its own name or its set's; a picked step counts its picks and their questions", () => {
  const c = set("c", 4, 6);
  assert.equal(stepName(step("s1", c)), "Set c");
  assert.equal(stepName(step("s1", c, null, "Closures")), "Closures");
  assert.equal(stepName(step("s1", null)), "A removed study set");
  assert.equal(stepCounts(step("s1", c)), "4 flashcards, 6 quiz questions");
  assert.equal(stepCounts(step("s1", c, ["c-f1"])), "1 of 4 flashcards, 2 quiz questions");
});

test("what its editors should fix: lost sets, empty steps, sets moved away and deleted picks", () => {
  const c = set("c", 2, 0);
  assert.equal(fixText(view([step("s1", c)])), null);
  const broken = view([step("s1", null), { ...step("s2", set("e", 0, 0)), check: "empty" }, { ...step("s3", c), check: "elsewhere" }, step("s4", c, ["c-f1", "gone-1", "gone-2"])]);
  assert.equal(fixText(broken), "1 step lost its study set; 1 step has nothing left to study; 1 step's study set moved to another subject; 2 picked flashcards were deleted. Learners skip what's gone.");
});

test("a picked step's own class: what you missed first, else its review, else its quiz, carrying the step", () => {
  const c = set("c", 3, 3);
  const stats = (over: object) => ({ missedFlashcards: 0, flashcards: 2, questions: 2, ...over }) as Parameters<typeof pickedClass>[1]["stats"];
  const entry = (over: object) => ({ step: step("s2", c, ["c-f1", "c-f2"]), set: c, stats: stats(over) });
  assert.deepEqual(pickedClass(PATH, entry({ missedFlashcards: 1 })), {
    label: "Go over what you missed",
    note: "1 flashcard in this step",
    icon: "focus",
    href: `/study-sets/c/review-missed?step=${PATH}.s2`,
  });
  assert.equal(pickedClass(PATH, entry({})).href, `/study-sets/c/review?step=${PATH}.s2`);
  assert.equal(pickedClass(PATH, entry({ flashcards: 0 })).label, "Quiz this step");
  assert.equal(testOutHref(PATH, "c", "s2"), `/study-sets/c/quiz?testout=1&step=${PATH}.s2`);
});

test("the step a class carries, read back: a path's id and a step's", () => {
  assert.deepEqual(parseStep(`${PATH}.s2`), { pathId: PATH, stepId: "s2" });
  assert.equal(parseStep("nope"), null);
  assert.equal(parseStep(null), null);
});
