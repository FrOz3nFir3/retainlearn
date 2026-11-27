// The report card's numbers (PLAN 14.10): each set's row and the overview, from the report card's data.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReportCard, ReportCardSet } from "@retainlearn/core";
import { hasQuizRecord, daysAgoInWords, matchesSearch, overview, studiedSets } from "./reportCardStats.ts";

const when = { today: "2026-11-24", timeZone: "UTC" };
const set = (over: Partial<ReportCardSet>): ReportCardSet => ({
  setId: "a",
  category: "Programming",
  topic: "JavaScript",
  subtopic: "Fundamentals",
  flashcardCount: 4,
  questionCount: 4,
  flashcards: {},
  questions: {},
  quiz: { started: 0, finished: 0 },
  lastAt: null,
  ...over,
});
const card = (sets: ReportCardSet[]): ReportCard => ({ xp: 120, level: 2, streak: { count: 3, freezes: 0 }, subjects: 2, sets, skills: [] });

const js = set({
  setId: "js",
  flashcards: { f1: { seenAt: "2026-11-20T10:00:00Z" }, f2: { seenAt: "2026-11-20T10:00:00Z", missedOn: "2026-11-20" } },
  questions: {
    q1: { level: 2, refreshedAt: "2026-11-23T10:00:00Z", right: 2, wrong: 0 }, // fresh: level 2 stays fresh 3 days
    q2: { level: 1, refreshedAt: "2026-11-10T10:00:00Z", right: 1, wrong: 1 }, // fading
    q3: { level: 0, right: 0, wrong: 1, missedOn: "2026-11-23" },
  },
  quiz: { started: 2, finished: 1 },
  lastAt: "2026-11-23T10:00:00.000Z",
});
const css = set({ setId: "css", topic: "CSS", subtopic: "Grid layout", flashcards: { f9: { seenAt: "2026-11-24T08:00:00Z" } }, lastAt: "2026-11-24T08:00:00.000Z" });

test("each set's row: what you've reviewed and answered, your player cards, and its one status", () => {
  const [latest, earlier] = studiedSets(card([js, css]), when);
  assert.equal(latest?.set.setId, "css", "the most recently studied first");
  assert.equal(earlier?.set.setId, "js");
  assert.deepEqual(
    { reviewed: earlier?.stats.reviewed, right: earlier?.stats.right, wrong: earlier?.stats.wrong, playerCards: earlier?.playerCards, fading: earlier?.fading },
    { reviewed: 2, right: 3, wrong: 2, playerCards: 2, fading: 1 },
  );
  assert.deepEqual(earlier?.status, { key: "missed", label: "2 missed" }, "a flashcard and a question missed, before anything fading");
  assert.equal(latest?.status.key, "inProgress");
});

test("the overview adds the sets up: answers count every try, and accuracy is the share right", () => {
  const card2 = card([js, css]);
  assert.deepEqual(overview(card2, studiedSets(card2, when)), {
    subjects: 2,
    setsStarted: 2,
    flashcardsReviewed: 3,
    answers: 5,
    accuracy: 3 / 5,
    playerCards: 2,
    fading: 1,
  });
  assert.equal(overview(card([css]), studiedSets(card([css]), when)).accuracy, null, "no answers yet");
});

test("the search matches every word typed, in any of a set's titles, in any case", () => {
  const [row] = studiedSets(card([js]), when);
  assert.ok(row);
  assert.ok(matchesSearch(row, "fundamentals"));
  assert.ok(matchesSearch(row, "  JavaScript   fund "));
  assert.ok(matchesSearch(row, "programming"));
  assert.ok(!matchesSearch(row, "javascript grid"));
  assert.ok(matchesSearch(row, ""), "nothing typed matches everything");
});

test("a set's quizzes have something to reset once an answer, a miss or a quiz is recorded, and nothing after a reset", () => {
  assert.ok(hasQuizRecord(js));
  assert.ok(!hasQuizRecord(css));
  const afterReset = set({ questions: { q1: { level: 2, refreshedAt: "2026-11-23T10:00:00Z" } } });
  assert.ok(!hasQuizRecord(afterReset), "player cards alone aren't a record");
});

test("when you last studied, in words", () => {
  assert.deepEqual([0, 1, 3, 7, 20, 45, 400].map(daysAgoInWords), ["today", "yesterday", "3 days ago", "last week", "2 weeks ago", "last month", "last year"]);
});
