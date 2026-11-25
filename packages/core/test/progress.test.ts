import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MASTERED,
  fadingBySubject,
  fadingCount,
  studySetStats,
  studySetStatus,
  subjectStats,
  subjectStatus,
  temperature,
} from "@retainlearn/core";
import type { StudySetStats } from "@retainlearn/core";
import { IST, cardsFirst, counted, makeSet, noon, reviewedFirst, seen } from "./helpers.ts";

const when = { today: "2026-11-21", timeZone: IST };
const near = (actual: number | null, expected: number) =>
  assert.ok(actual != null && Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

const js = makeSet("js", "Programming", 10, 10);
// Eight flashcards reviewed, two of them missed (one yesterday, one today). Five questions answered: right 5 times
// and wrong twice, and two of them still missed (one yesterday, one today).
const jsFlashcards = {
  ...reviewedFirst(js, 8),
  "js-f2": seen("2026-11-20"),
  "js-f5": seen("2026-11-21"),
};
const jsQuestions = {
  "js-q1": { level: 2, refreshedAt: noon("2026-11-20"), right: 2, wrong: 0, missedOn: null },
  "js-q2": { level: 1, refreshedAt: noon("2026-11-18"), right: 1, wrong: 1, missedOn: "2026-11-20" },
  "js-q3": { level: 1, refreshedAt: noon("2026-11-20"), right: 1, wrong: 0, missedOn: null },
  "js-q4": { level: 0, right: 0, wrong: 1, missedOn: "2026-11-21" },
  "js-q5": { level: 1, refreshedAt: noon("2026-11-21"), right: 1, wrong: 0, missedOn: null },
};
const jsProgress = { flashcards: jsFlashcards, questions: jsQuestions, lastAt: noon("2026-11-21") };

test("a study set's numbers come from your progress in it", () => {
  const st = studySetStats(js, jsProgress, when);
  assert.equal(st.started, true);
  assert.equal(st.reviewed, 8);
  assert.equal(st.unreviewed, 2);
  assert.deepEqual(st.missedFlashcardIds, ["js-f2", "js-f5"]);
  assert.deepEqual(st.missedQuestionIds, ["js-q2", "js-q4"]);
  assert.equal(st.dueFlashcards, 1, "missed before today: due back");
  assert.equal(st.dueQuestions, 1, "today's misses wait a day");
  assert.equal(st.answered, 5);
  near(st.accuracy, 5 / 7);
  assert.equal(st.daysAgo, 0);
});

test("mastery for a set with flashcards and questions is the prototype's: 70% reviewing, 30% quizzing", () => {
  // 80% of the flashcards reviewed, a quarter of those missed; 5 of 7 answers right, on half the questions.
  near(studySetStats(js, jsProgress, when).mastery, 0.7 * 0.8 * (1 - 0.6 * 0.25) + 0.3 * (5 / 7) * 0.5);
});

test("only items still in the set count when its content is known; a counted set takes progress as it is", () => {
  const withDeleted = {
    flashcards: { ...jsFlashcards, "js-f99": seen("2026-11-20") },
    questions: { ...jsQuestions, "js-q99": { level: 0, wrong: 3, missedOn: "2026-11-20" } },
    lastAt: noon("2026-11-21"),
  };
  const content = studySetStats(js, withDeleted, when);
  assert.deepEqual([content.reviewed, content.missedFlashcards, content.missedQuestions, content.wrong], [8, 2, 2, 2]);
  const byCount = studySetStats(counted(js), withDeleted, when);
  assert.deepEqual([byCount.reviewed, byCount.missedFlashcards, byCount.missedQuestions, byCount.wrong], [9, 3, 3, 5]);
});

test("a set you haven't started", () => {
  const st = studySetStats(js, undefined, when);
  assert.equal(st.started, false);
  assert.equal(st.mastery, 0);
  assert.equal(st.unreviewed, 10);
  assert.equal(st.accuracy, null);
  assert.equal(st.daysAgo, null);
  assert.deepEqual(studySetStatus(st), { key: "new", label: "Not started" });
});

test("a set with only flashcards, or only questions, can be mastered (the prototype capped them at 70% and 30%)", () => {
  const notes = makeSet("notes", "Physics", 4, 0);
  const notesStats = studySetStats(notes, { flashcards: reviewedFirst(notes, 4), lastAt: noon("2026-11-21") }, when);
  assert.equal(notesStats.mastery, 1);
  assert.deepEqual(studySetStatus(notesStats), { key: "mastered", label: "Mastered" });

  const drill = makeSet("drill", "Physics", 0, 4);
  assert.equal(studySetStats(drill, { questions: cardsFirst(drill, 4, 1, "2026-11-21"), lastAt: noon("2026-11-21") }, when).mastery, 1);

  // A set with both needs both: every flashcard reviewed, but no question answered, is 70%.
  const both = makeSet("both", "Physics", 4, 4);
  const bothStats = studySetStats(both, { flashcards: reviewedFirst(both, 4), lastAt: noon("2026-11-21") }, when);
  near(bothStats.mastery, 0.7);
  assert.ok(bothStats.mastery < MASTERED);
});

test("the days since you were last in a set are counted where you are", () => {
  const p = { lastAt: new Date("2026-11-20T19:00:00Z") }; // 00:30 on the 21st in India
  assert.equal(studySetStats(js, p, when).daysAgo, 0);
  assert.equal(studySetStats(js, p, { today: "2026-11-21", timeZone: "UTC" }).daysAgo, 1);
});

test("progress read without lean(), as Maps, counts the same", () => {
  const p = { flashcards: new Map(Object.entries(jsFlashcards)), questions: new Map(Object.entries(jsQuestions)), lastAt: noon("2026-11-21") };
  const st = studySetStats(js, p, when);
  assert.equal(st.reviewed, 8);
  assert.equal(st.missedQuestions, 2);
  near(st.mastery, studySetStats(js, jsProgress, when).mastery);
});

test("a subject weighs its sets by size, flashcards plus questions (the prototype counted flashcards only)", () => {
  const a = makeSet("a", "Physics", 10, 10);
  const b = makeSet("b", "Physics", 0, 4);
  const c = makeSet("c", "Physics", 6, 0);
  const progress = {
    a: { flashcards: reviewedFirst(a, 10), lastAt: noon("2026-11-19") }, // 70%
    b: { questions: cardsFirst(b, 4, 1, "2026-11-20"), lastAt: noon("2026-11-20") }, // 100%
  };
  const subject = subjectStats([a, b, c], progress, when);
  near(subject.mastery, (0.7 * 20 + 1 * 4 + 0 * 6) / 30);
  assert.equal(subject.started, 2);
  assert.equal(subject.flashcards, 16);
  assert.equal(subject.questions, 14);
  assert.equal(subject.daysAgo, 1);
  assert.deepEqual(subject.lastAt, noon("2026-11-20"));
  assert.equal(subject.accuracy, 1);
  assert.equal(subject.status, "warm");
});

test("a subject cools while you stay away: warm, cooling from 2 days, cold from 4", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 30].map((d) => temperature(d)), ["warm", "warm", "cooling", "cooling", "cold", "cold"]);
  assert.equal(subjectStatus({ empty: true, started: 0, daysAgo: null }), "empty");
  assert.equal(subjectStatus({ empty: false, started: 0, daysAgo: null }), "new");
  assert.equal(subjectStatus({ empty: false, started: 1, daysAgo: null }), "cold", "no date to go by");
  assert.equal(subjectStats([], {}, when).status, "empty");
});

test("a study set shows one status, the most useful first", () => {
  const base = studySetStats(js, jsProgress, when);
  const with_ = (over: Partial<StudySetStats>): StudySetStats => ({ ...base, missedFlashcards: 0, missedQuestions: 0, mastery: 0.5, ...over });
  assert.deepEqual(studySetStatus(with_({ empty: true })), { key: "empty", label: "Nothing to study yet" });
  assert.deepEqual(studySetStatus(with_({ started: false })), { key: "new", label: "Not started" });
  assert.deepEqual(studySetStatus(with_({ missedFlashcards: 2, missedQuestions: 1 }), 4), { key: "missed", label: "3 missed" }, "missed comes before fading");
  assert.deepEqual(studySetStatus(with_({ mastery: 0.9 }), 2), { key: "fading", label: "2 fading" }, "fading comes before mastered");
  assert.deepEqual(studySetStatus(with_({ mastery: MASTERED })), { key: "mastered", label: "Mastered" });
  assert.deepEqual(studySetStatus(with_({})), { key: "inProgress", label: "In progress" });
});

test("fading player cards are counted per set, and per subject as today's activity keeps them", () => {
  // js-q2 is at level 1 and was last remembered 3 days ago; the others are fresh, or not cards.
  assert.equal(fadingCount(js, jsProgress, when), 1);
  const phy = makeSet("phy", "Physics", 2, 2);
  const phyProgress = {
    questions: {
      "phy-q1": { level: 1, refreshedAt: noon("2026-11-10") }, // 11 days at level 1: fading
      "phy-q2": { level: 4, refreshedAt: noon("2026-11-10") }, // 11 days at level 4 (16): fresh
    },
  };
  assert.deepEqual(fadingBySubject([js, phy], { js: jsProgress, phy: phyProgress }, when), [
    { category: "Programming", count: 1 },
    { category: "Physics", count: 1 },
  ]);
  // A question deleted from the set stops counting when the set's content is known.
  const withDeleted = { ...jsProgress, questions: { ...jsQuestions, "js-q99": { level: 1, refreshedAt: noon("2026-11-01") } } };
  assert.equal(fadingCount(js, withDeleted, when), 1);
  assert.equal(fadingCount(counted(js), withDeleted, when), 2);
});

test("progress with nothing in it, as the progress endpoint answers for a set you haven't started, isn't started", () => {
  const blank = studySetStats(js, { flashcards: {}, questions: {}, lastAt: null }, when);
  assert.equal(blank.started, false);
  assert.equal(blank.unreviewed, 10);
  assert.equal(studySetStatus(blank).key, "new");
  assert.equal(studySetStats(js, { flashcards: new Map(), questions: new Map() }, when).started, false);
  assert.equal(studySetStats(js, { flashcards: { "js-f1": seen("2026-11-20") }, questions: {}, lastAt: null }, when).started, true, "a flashcard seen is a start");
});
