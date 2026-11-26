// A subject's page (P2-20): each set with your progress from the report card, the subject's numbers, what's up next
// there, and the order that puts what needs you first.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReportCard, ReportCardSet, Subject } from "@retainlearn/core";
import { alsoNeedsAttention, matchesSearch, ordered, subjectProgress, upNextHere } from "./subjectProgress.ts";

const when = { today: "2026-11-24", timeZone: "UTC" };
const subject: Subject = {
  name: "Programming",
  sets: [
    { _id: "js", topic: "JavaScript", subtopic: "Fundamentals", flashcards: 4, questions: 2 },
    { _id: "css", topic: "CSS", subtopic: "Grid layout", flashcards: 4, questions: 0 },
    { _id: "go", topic: "Go", subtopic: "Channels", flashcards: 3, questions: 0 },
    { _id: "empty", topic: "Rust", subtopic: "Ownership", flashcards: 0, questions: 0 },
  ],
};
const studied = (over: Partial<ReportCardSet>): ReportCardSet => ({
  setId: "js",
  category: "Programming",
  topic: "JavaScript",
  subtopic: "Fundamentals",
  flashcardCount: 4,
  questionCount: 2,
  flashcards: {},
  questions: {},
  quiz: { started: 0, finished: 0 },
  lastAt: "2026-11-23T10:00:00.000Z",
  ...over,
});
const card = (sets: ReportCardSet[]): ReportCard => ({ xp: 0, level: 1, streak: { count: 0, freezes: 0 }, subjects: 1, sets });

const css = studied({ setId: "css", topic: "CSS", subtopic: "Grid layout", flashcards: { f1: { seenAt: "2026-11-23T10:00:00Z" } } });
const js = studied({ flashcards: { f1: { seenAt: "2026-11-20T10:00:00Z", missedOn: "2026-11-20" } }, questions: { q1: { level: 0, right: 0, wrong: 1, missedOn: "2026-11-23" } } });
const elsewhere = studied({ setId: "bio", category: "Biology" });

test("each set gets your progress from the report card, and the subject its numbers; signed out, none", () => {
  const { rooms, stats } = subjectProgress(subject, card([js, css, elsewhere]), when);
  assert.deepEqual(
    rooms.map((r) => [r.set._id, r.status.key]),
    [
      ["js", "missed"],
      ["css", "inProgress"],
      ["go", "new"],
      ["empty", "empty"],
    ],
  );
  assert.deepEqual({ started: stats.started, missed: stats.missed }, { started: 2, missed: 2 }, "only this subject's sets");
  const out = subjectProgress(subject, null, when);
  assert.deepEqual(out.rooms.map((r) => r.status.key), ["new", "new", "new", "empty"]);
  assert.equal(out.stats.started, 0);
});

test("up next here: the most missed first, then what you're part way through, then the first not started", () => {
  const next = (sets: ReportCardSet[]) => {
    const found = upNextHere(subjectProgress(subject, card(sets), when).rooms);
    return found && [found.room.set._id, found.why];
  };
  assert.deepEqual(next([js, css]), ["js", "2 missed"]);
  assert.deepEqual(next([css]), ["css", "1 of 4 flashcards seen so far"]);
  assert.deepEqual(next([]), ["js", "Not started yet"]);
  const seenAll = { f1: { seenAt: "2026-11-23T10:00:00Z" }, f2: { seenAt: "2026-11-23T10:00:00Z" }, f3: { seenAt: "2026-11-23T10:00:00Z" } };
  const done = [
    studied({ flashcards: { ...seenAll, f4: { seenAt: "2026-11-23T10:00:00Z" } } }),
    studied({ setId: "css", flashcards: { ...seenAll, f4: { seenAt: "2026-11-23T10:00:00Z" } } }),
    studied({ setId: "go", flashcards: seenAll }),
  ];
  assert.equal(next(done), null, "nothing missed, nothing left to see, nothing new: all caught up");
});

test("needs attention puts missed sets first and empty ones last; building order keeps the order they were added", () => {
  const { rooms } = subjectProgress(subject, card([js, css]), when);
  assert.deepEqual(ordered(rooms, "attention").map((r) => r.set._id), ["js", "css", "go", "empty"]);
  assert.deepEqual(ordered(rooms, "building").map((r) => r.set._id), ["js", "css", "go", "empty"]);
  const flipped = subjectProgress({ ...subject, sets: subject.sets.toReversed() }, card([js, css]), when).rooms;
  assert.deepEqual(ordered(flipped, "attention").map((r) => r.set._id), ["js", "css", "go", "empty"]);
});

test("search matches every word typed in a set's titles, in any case", () => {
  const set = subject.sets[1]!;
  assert.ok(matchesSearch(set, "grid"));
  assert.ok(matchesSearch(set, "CSS  layout"));
  assert.ok(!matchesSearch(set, "flex"));
});

test("also needing attention: the other sets with something missed, fading or half done, most pressing first, never Up next's", () => {
  const go = studied({ setId: "go", topic: "Go", subtopic: "Channels", flashcards: { f1: { seenAt: "2026-11-23T10:00:00Z" } } });
  const { rooms } = subjectProgress(subject, card([js, css, go]), when);
  const next = upNextHere(rooms)?.room ?? null;
  assert.equal(next?.set._id, "js", "the missed one is Up next");
  assert.deepEqual(
    alsoNeedsAttention(rooms, next).map((r) => r.set._id),
    ["css", "go"],
    "the half-done ones, not Up next's, not the empty one",
  );
  assert.deepEqual(alsoNeedsAttention(rooms, next, 1).map((r) => r.set._id), ["css"], "up to the most asked for");
  assert.deepEqual(alsoNeedsAttention(subjectProgress(subject, null, when).rooms, null), [], "signed out: none");
});
