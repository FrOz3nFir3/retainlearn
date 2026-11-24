// What a quiz asks: the next round by default, a chosen round, a mixed quiz, your pick, or a retry of what you missed;
// and each question's options. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ProgressView, StudySetContent } from "@retainlearn/core";
import { MAX_OPTIONS, answerOptions, planQuiz } from "./quizPlan.ts";

const when = { today: "2026-11-24", timeZone: "Asia/Kolkata" };
const fixed = () => 0;
const whole = () => 4;

// 8 flashcards with a question each: two rounds of 4.
const set: StudySetContent = {
  _id: "s",
  category: "Programming",
  topic: "JavaScript",
  subtopic: "Basics",
  description: "",
  listed: true,
  version: 1,
  flashcards: Array.from({ length: 8 }, (_, i) => ({ _id: `f${i + 1}`, question: `<p>Card ${i + 1}</p>`, answer: "<p>A</p>" })),
  questions: Array.from({ length: 8 }, (_, i) => ({ _id: `q${i + 1}`, question: `<p>Q ${i + 1}</p>`, answer: "Yes", wrongAnswers: ["No", "Maybe", "Never", "Always"], flashcardId: `f${i + 1}` })),
};
const progress = (questions: ProgressView["questions"]): ProgressView => ({ setId: "s", flashcards: {}, questions, order: null, quiz: { started: 0, finished: 0 }, classInProgress: null, lastAt: null });
const ids = (qs: { _id: string }[]) => qs.map((q) => q._id).sort();

test("a quiz is the next round with questions not answered yet, or the round asked for", () => {
  const first = planQuiz(set, null, false, when, {}, whole, fixed);
  assert.deepEqual([first.title, first.round, ids(first.questions)], ["Round 1 of 2", 1, ["q1", "q2", "q3", "q4"]]);

  const roundOneDone = progress(Object.fromEntries(["q1", "q2", "q3", "q4"].map((id) => [id, { level: 1, refreshedAt: "2026-11-24T06:00:00Z", missedOn: null }])));
  assert.equal(planQuiz(set, roundOneDone, false, when, {}, whole, fixed).round, 2);
  assert.equal(planQuiz(set, null, false, when, { round: 2 }, whole, fixed).round, 2);
});

test("a retry asks only what you missed, or the missed questions you picked", () => {
  const missed = progress({ q2: { level: 0, missedOn: "2026-11-23" }, q7: { level: 1, missedOn: "2026-11-24" }, q3: { level: 1, missedOn: null } });
  assert.deepEqual(ids(planQuiz(set, missed, true, when, {}, whole, fixed).questions), ["q2", "q7"]);
  assert.deepEqual(ids(planQuiz(set, missed, true, when, { picked: new Set(["q7", "q3"]) }, whole, fixed).questions), ["q7"]);
});

test("your pick asks exactly the questions you chose", () => {
  assert.deepEqual(ids(planQuiz(set, null, false, when, { picked: new Set(["q5", "q1"]) }, whole, fixed).questions), ["q1", "q5"]);
});

test("a question's options are its answer and at most three wrong ones, so the answer is always there", () => {
  for (const random of [() => 0, () => 0.99, Math.random]) {
    const options = answerOptions(set.questions[0]!, random);
    assert.equal(options.length, MAX_OPTIONS);
    assert.equal(options.filter((o) => o.correct).length, 1);
    assert.equal(options.find((o) => o.correct)?.html, "Yes");
  }
});
