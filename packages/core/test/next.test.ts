// What to do next in a study set: one next step, in the prototype's order. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundState, setRounds, studyPlan } from "@retainlearn/core";
import type { ClassInProgress, StudyView } from "@retainlearn/core";
import { IST, cardsFirst, makeSet, noon, reviewedFirst } from "./helpers.ts";

const when = { today: "2026-11-24", timeZone: IST };
const whole = () => 4;
// 8 flashcards with a question each: two rounds of 4.
const set = makeSet("s", "Programming", 8, 8);
const rounds = setRounds(set, null, whole);
type P = Parameters<typeof studyPlan>[0]["progress"];
const plan = (progress: P, view: StudyView = "both") => studyPlan({ rounds, states: rounds.map((r) => roundState(r, progress, when)), progress, when, view, loadOf: whole });
const left = (over: Partial<ClassInProgress>): ClassInProgress => ({ key: "review:2:abc", mode: "review", day: when.today, seq: 1, ids: ["s-f5", "s-f6", "s-f7", "s-f8"], index: 1, ...over });

test("a new set: round 1, its review first, then its quiz", () => {
  const p = plan(null);
  assert.equal(p.next?.label, "Round 1");
  assert.deepEqual(p.next?.steps, [
    { text: "Review · 4 flashcards", state: "now" },
    { text: "Quiz · 4 questions", state: "later" },
  ]);
  assert.deepEqual(p.next?.action, { mode: "review", round: 1 });
  assert.equal(p.current, 1);
  assert.equal(p.currentTag, "Up next");
});

test("a class left halfway today comes first, in its round", () => {
  const p = plan({ flashcards: reviewedFirst(set, 4), classInProgress: left({}) });
  assert.equal(p.next?.label, "Continue review round 2");
  assert.equal(p.next?.note, "Flashcard 2 of 4");
  assert.deepEqual(p.next?.action, { mode: "review", round: 2 });
  assert.equal(p.current, 2);
});

test("not one only opened, left another day, or of picked items", () => {
  assert.notEqual(plan({ classInProgress: left({ index: 0 }) }).next?.kind, "continue");
  assert.notEqual(plan({ classInProgress: left({ day: "2026-11-23" }) }).next?.kind, "continue");
  assert.notEqual(plan({ classInProgress: left({ key: "reviewMissed:pick:abc", mode: "reviewMissed" }) }).next?.kind, "continue");
});

test("what you missed before today comes before the rounds; today's misses wait", () => {
  const before = plan({ flashcards: { ...reviewedFirst(set, 4), "s-f2": { seenAt: noon("2026-11-20"), missedOn: "2026-11-20" } } });
  assert.equal(before.next?.label, "Go over what you missed");
  assert.equal(before.next?.note, "1 flashcard from before today");
  assert.deepEqual(before.next?.action, { mode: "reviewMissed", ids: ["s-f2"] });
  assert.equal(before.currentTag, "Next round");

  const today = plan({ flashcards: { ...reviewedFirst(set, 4), "s-f2": { seenAt: noon("2026-11-24"), missedOn: "2026-11-24" } } });
  assert.equal(today.next?.kind, "round");
  assert.equal(today.others[0]?.label, "Go over what you missed");
});

test("in Review only or Quiz only, the next round of that", () => {
  const review = plan(null, "review");
  assert.equal(review.next?.label, "Review round 1");
  assert.equal(review.next?.note, "4 flashcards, about 16 recall points");
  const quiz = plan(null, "quiz");
  assert.equal(quiz.next?.label, "Quiz round 1");
  assert.equal(quiz.next?.note, "4 quiz questions");
});

test("every round done: today's misses, then a mixed quiz, then round 1 again", () => {
  const all = { flashcards: reviewedFirst(set, 8) };
  const missedToday = plan({ ...all, questions: { ...cardsFirst(set, 8, 1, "2026-11-20"), "s-q3": { level: 0, right: 0, wrong: 1, missedOn: "2026-11-24" } } });
  assert.equal(missedToday.next?.label, "Retry what you missed");
  assert.equal(missedToday.next?.note, "Every round is done. Missed: 1 quiz question");

  const mixed = plan({ ...all, questions: cardsFirst(set, 8, 1, "2026-11-20") });
  assert.equal(mixed.next?.label, "Mixed quiz");
  assert.deepEqual(mixed.next?.action, { mode: "quiz", mix: true });
  assert.equal(mixed.current, null);

  // Everything remembered today: nothing to mix until tomorrow.
  const again = plan({ ...all, questions: cardsFirst(set, 8, 1, "2026-11-24") });
  assert.equal(again.next?.label, "Review again");
  assert.deepEqual(again.next?.action, { mode: "review", round: 1 });
});

test("a mixed quiz needs three questions that can be mixed, not just three player cards", () => {
  // Three held, but two remembered today: one to mix.
  const progress = { flashcards: reviewedFirst(set, 8), questions: { ...cardsFirst(set, 8, 1, "2026-11-24"), ...cardsFirst(set, 1, 1, "2026-11-20") } };
  assert.ok(!plan(progress).others.some((o) => o.kind === "mixed"));
});

test("a set of questions only shows quizzes, whatever the view", () => {
  const quizOnly = makeSet("q", "Programming", 0, 5);
  const qRounds = setRounds(quizOnly, null, whole);
  const p = studyPlan({ rounds: qRounds, states: qRounds.map((r) => roundState(r, null, when)), progress: null, when, view: "both", loadOf: whole });
  assert.equal(p.view, "quiz");
  assert.equal(p.next?.label, "Quiz round 1");
});
