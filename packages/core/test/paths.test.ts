import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MASTERED,
  PathContent,
  TEST_OUT,
  checkStep,
  checkTestOut,
  cleanStep,
  mergeSuggestion,
  pathChanges,
  pathProgress,
  stepItems,
  stepStats,
  testOutPass,
  testOutPick,
  testOutSize,
  testedOutKey,
} from "@retainlearn/core";
import type { PathStep, PathVersion, Progress } from "@retainlearn/core";
import { IST, cardsFirst, makeSet, noon, reviewedFirst } from "./helpers.ts";

const when = { today: "2026-11-21", timeZone: IST };
const stepSet = (id: string, flashcards: number, questions: number, category = "Programming") => ({ ...makeSet(id, category, flashcards, questions), title: `Set ${id}` });
const progressOf = (flashcards: Progress["flashcards"], questions: Progress["questions"] = {}): Progress => ({ flashcards, questions, lastAt: noon("2026-11-20") });
const whole = (id: string, setId: string, title = ""): PathStep => ({ id, setId, flashcardIds: null, title });

// ---------- What a path may hold ----------

const hex = (n: number) => n.toString(16).padStart(24, "0");
const content = (steps: unknown[]) => ({ title: "  JavaScript   fundamentals ", category: "programming", description: "", visibility: "public", exam: true, steps });

test("a path's content: its title tidied, its subject as subjects are kept, and its steps", () => {
  const parsed = PathContent.parse(content([{ id: "s1", setId: hex(1).toUpperCase(), flashcardIds: null, title: " Basics " }]));
  assert.equal(parsed.title, "JavaScript fundamentals");
  assert.equal(parsed.category, "Programming");
  assert.deepEqual(parsed.steps, [{ id: "s1", setId: hex(1), flashcardIds: null, title: "Basics" }]);
});

test("a path needs a title and a step; each step's id comes once, and each picked flashcard once in its step", () => {
  assert.equal(PathContent.safeParse({ ...content([whole("s1", hex(1))]), title: " " }).success, false);
  assert.equal(PathContent.safeParse(content([])).success, false);
  assert.equal(PathContent.safeParse(content([whole("s1", hex(1)), whole("s1", hex(2))])).success, false);
  assert.equal(PathContent.safeParse(content([{ id: "s1", setId: hex(1), flashcardIds: [hex(5), hex(5)], title: "" }])).success, false);
  assert.equal(PathContent.safeParse(content([{ id: "s1", setId: hex(1), flashcardIds: [], title: "" }])).success, false);
  assert.equal(PathContent.safeParse({ ...content([whole("s1", hex(1))]), visibility: "friends" }).success, false);
});

// ---------- A step's items ----------

test("a step's items: the whole set's, or the picked flashcards still in the set and the questions linked to them", () => {
  const set = stepSet("js", 4, 6); // questions q1..q6 linked to f1..f4 in turn: q1 f1, q2 f2, q3 f3, q4 f4, q5 f1, q6 f2
  assert.equal(stepItems({ flashcardIds: null }, set).questions.length, 6);
  const picked = stepItems({ flashcardIds: ["js-f1", "js-f3", "gone"] }, set);
  assert.deepEqual(
    picked.flashcards.map((f) => f._id),
    ["js-f1", "js-f3"],
  );
  assert.deepEqual(
    picked.questions.map((q) => q._id),
    ["js-q1", "js-q3", "js-q5"],
  );
  assert.deepEqual(cleanStep({ flashcardIds: ["js-f1", "gone"] }, set).flashcardIds, ["js-f1"]);
});

test("a step that can't be studied: its set gone, or nothing in it; a set moved to another subject is still studied", () => {
  assert.equal(checkStep({ flashcardIds: null }, null, "Programming"), "gone");
  assert.equal(checkStep({ flashcardIds: null }, stepSet("empty", 0, 0), "Programming"), "empty");
  assert.equal(checkStep({ flashcardIds: ["gone"] }, stepSet("js", 3, 3), "Programming"), "empty");
  assert.equal(checkStep({ flashcardIds: null }, stepSet("quiz", 0, 4), "Programming"), "ok");
  assert.equal(checkStep({ flashcardIds: null }, stepSet("bio", 2, 2, "Biology"), "Programming"), "elsewhere");
});

test("a picked step's numbers go by its own flashcards and questions, by the study sets' rules", () => {
  const set = stepSet("js", 10, 10);
  const p = progressOf(reviewedFirst(set, 2), cardsFirst(set, 2, 1, "2026-11-20"));
  const picked = stepStats({ flashcardIds: ["js-f1", "js-f2"] }, set, p, when);
  assert.equal(picked.flashcards, 2);
  assert.equal(picked.questions, 2);
  assert.equal(picked.mastery, 1);
  assert.ok(stepStats({ flashcardIds: null }, set, p, when).mastery < MASTERED);
});

// ---------- How far along a path you are ----------

test("a path's steps: done (mastered or tested out), current, open (practised) and locked; steps that can't be studied left out", () => {
  const a = stepSet("a", 4, 4);
  const b = stepSet("b", 4, 4);
  const c = stepSet("c", 4, 4);
  const d = stepSet("d", 4, 4);
  const e = stepSet("e", 4, 4);
  const sets = new Map([a, b, c, d, e].map((s) => [s._id, s]));
  const steps = [whole("s1", "a"), whole("s2", "b"), whole("s3", "c"), whole("s4", "d"), whole("s5", "e"), whole("s6", "gone")];
  const progress = {
    a: progressOf(reviewedFirst(a, 4), cardsFirst(a, 4, 1, "2026-11-20")), // mastered
    c: progressOf(reviewedFirst(c, 1)), // a little
    d: progressOf(reviewedFirst(d, 2)), // practised: half its flashcards
  };
  const path = pathProgress({ pathId: "p1", category: "Programming", steps, sets, progress, testedOut: [testedOutKey("p1", "s5")], when });
  assert.deepEqual(
    path.steps.map((s) => s.state),
    ["done", "current", "locked", "open", "done"],
  );
  assert.equal(path.total, 5);
  assert.equal(path.done, 2);
  assert.equal(path.current?.step.id, "s2");
  assert.equal(path.complete, false);
  assert.equal(path.steps[4]?.testedOut, true);
});

test("a path is complete when every step it has is done, and a path with none never is", () => {
  const a = stepSet("a", 2, 0);
  const sets = new Map([[a._id, a]]);
  const done = pathProgress({ pathId: "p", category: "Programming", steps: [whole("s1", "a")], sets, progress: { a: progressOf(reviewedFirst(a, 2)) }, testedOut: [], when });
  assert.equal(done.complete, true);
  assert.equal(pathProgress({ pathId: "p", category: "Programming", steps: [whole("s1", "gone")], sets, progress: {}, testedOut: [], when }).complete, false);
});

// ---------- Testing out of a step ----------

test("a test out asks up to 10 questions, one from each round before any round gets a second", () => {
  const rounds = [{ questions: ["a1", "a2", "a3", "a4"] }, { questions: ["b1", "b2", "b3", "b4"] }, { questions: ["c1"] }];
  const keep = () => 0.999; // a shuffle that leaves everything where it is
  const asked = testOutPick(rounds, keep);
  assert.equal(asked.length, 9);
  assert.deepEqual(asked.slice(0, 3).toSorted(), ["a1", "b1", "c1"]);
  const many = Array.from({ length: 6 }, (_, r) => ({ questions: Array.from({ length: 4 }, (_, i) => `r${r}q${i}`) }));
  const ten = testOutPick(many, keep);
  assert.equal(ten.length, TEST_OUT.questions);
  assert.equal(new Set(ten.slice(0, 6).map((q) => q.slice(0, 2))).size, 6);
});

test("a test out passes at 80% right, rounded up: 8 of 10, 5 of 6", () => {
  assert.equal(testOutSize(25), 10);
  assert.equal(testOutSize(6), 6);
  assert.equal(testOutPass(10), 8);
  assert.equal(testOutPass(6), 5);
});

test("a test out is checked: the step's questions, each once, as many as it asks, and enough right", () => {
  const set = stepSet("js", 10, 12);
  const answers = (ids: string[], right: number) => ids.map((questionId, i) => ({ questionId, right: i < right }));
  const ten = set.questions.slice(0, 10).map((q) => String(q._id));
  assert.equal(checkTestOut({ flashcardIds: null }, set, answers(ten, 8)), "passed");
  assert.equal(checkTestOut({ flashcardIds: null }, set, answers(ten, 7)), "failed");
  assert.equal(checkTestOut({ flashcardIds: null }, set, answers(ten.slice(0, 9), 9)), "notTheStep");
  assert.equal(checkTestOut({ flashcardIds: null }, set, answers([...ten.slice(0, 9), ten[0] as string], 10)), "notTheStep");
  assert.equal(checkTestOut({ flashcardIds: null }, set, answers([...ten.slice(0, 9), "someone-else"], 10)), "notTheStep");
  // A picked step asks its own questions: f1 and f2 have q1, q2, q11, q12 (questions go round the 10 flashcards).
  assert.equal(checkTestOut({ flashcardIds: ["js-f1", "js-f2"] }, set, answers(["js-q1", "js-q2", "js-q11", "js-q12"], 4)), "passed");
  assert.equal(checkTestOut({ flashcardIds: null }, stepSet("cards", 3, 0), []), "noTestOut");
});

// ---------- What changed ----------

const version = (steps: PathStep[], more: Partial<PathVersion> = {}): PathVersion => ({ title: "JS", category: "Programming", description: "", visibility: "public", exam: true, steps, ...more });
const named = new Map([stepSet("a", 3, 0), stepSet("b", 5, 0), stepSet("c", 2, 0)].map((s) => [s._id, s]));

test("what changed between two versions, in plain words, moves explained by the step that moved furthest", () => {
  const before = version([whole("s1", "a"), whole("s2", "b"), whole("s3", "c")]);
  const after = version([whole("s3", "c"), { ...whole("s1", "a", "Start here"), flashcardIds: ["a-f1"] }, whole("s4", "b")], { title: "JS basics", exam: false });
  assert.deepEqual(pathChanges(before, after, named), [
    'Renamed to "JS basics"',
    "Removed the final exam",
    "Removed step: Set b",
    'Renamed step Set a to "Start here"',
    "Start here: now 1 picked flashcard",
    "Added step: Set b (whole set, 5 flashcards)",
    "Moved Set c above Start here",
  ]);
  assert.deepEqual(pathChanges(before, before, named), []);
});

test("accepting a suggestion applies its own changes to the path as it is now, keeping edits made since", () => {
  const before = version([whole("s1", "a"), whole("s2", "b")]);
  const suggested = version([whole("s2", "b", "Second first"), whole("s1", "a"), whole("s9", "c")], { description: "From a learner" });
  // Since the suggestion: the title changed, and a step was added after s1.
  const current = version([whole("s1", "a"), whole("s5", "c"), whole("s2", "b")], { title: "JS (edited)" });
  const merged = mergeSuggestion(current, before, suggested);
  assert.equal(merged.title, "JS (edited)");
  assert.equal(merged.description, "From a learner");
  assert.deepEqual(
    merged.steps.map((s) => s.id),
    ["s2", "s1", "s5", "s9"],
  );
  assert.equal(merged.steps[0]?.title, "Second first");
});

// ---------- Your path on the timetable ----------

test("your path's current step as a period: its class, its place, and a picked step's own scope", async () => {
  const { pathPeriod, planDay } = await import("@retainlearn/core");
  const a = stepSet("a", 4, 4);
  const b = stepSet("b", 4, 4);
  const sets = new Map([a, b].map((s) => [s._id, s]));
  const path = (progress = {}) => pathProgress({ pathId: "p1", category: "Programming", steps: [whole("s1", "a"), { ...whole("s2", "b"), flashcardIds: ["b-f1", "b-f2"] }], sets, progress, testedOut: [], when });
  assert.deepEqual(pathPeriod("p1", "JS", path()), { setId: "a", category: "Programming", mode: "review", n: 1, of: 2, title: "JS", step: null });
  const doneA = { a: progressOf(reviewedFirst(a, 4), cardsFirst(a, 4, 1, "2026-11-20")), b: progressOf({ ...reviewedFirst(b, 1, "2026-11-20") }) };
  assert.deepEqual(pathPeriod("p1", "JS", path(doneA)), { setId: "b", category: "Programming", mode: "reviewMissed", n: 2, of: 2, title: "JS", step: "p1.s2" });
  const all = { a: doneA.a, b: progressOf(reviewedFirst(b, 4), cardsFirst(b, 4, 1, "2026-11-20")) };
  assert.equal(pathPeriod("p1", "JS", path(all)), null);

  // First on the day's timetable when its subject is on your campus; otherwise left out.
  const period = pathPeriod("p1", "JS", path(doneA));
  const day = planDay({ sets: [a, b], progress: doneA, subjects: ["Programming"], today: when.today, timeZone: IST, path: period });
  assert.deepEqual(day[0], { kind: "class", setId: "b", mode: "reviewMissed", why: { kind: "path", n: 2, of: 2, title: "JS" }, done: false, step: "p1.s2" });
  assert.ok(!day.slice(1).some((p) => p.setId === "b"));
  assert.ok(!planDay({ sets: [a, b], progress: doneA, subjects: ["Biology"], today: when.today, timeZone: IST, path: period }).length);
});
