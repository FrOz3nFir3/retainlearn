// What the coach says, in which order, and when it's news. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Campus } from "@retainlearn/core";
import { coachFor, coachLines, isNews } from "./coach.ts";

const DAY = "2026-11-27";
const SET = "0".repeat(23) + "1";
const campus = (over: { player?: Partial<Campus["player"]>; timetable?: Campus["timetable"]; fading?: Campus["fading"]; subjects?: Campus["subjects"] } = {}): Campus => ({
  day: DAY,
  player: {
    settings: { view3d: null, look: "kit", sky: "auto", theme: "system", studyView: "both", extraTime: false, timeZone: "Asia/Kolkata" },
    coach: { heard: null, quiet: null, toured: true },
    xp: 0,
    level: 1,
    streak: { count: 0, freezes: 0, keptToday: false },
    unlocks: [],
    classLeft: null,
    away: null,
    ...over.player,
  },
  subjects: over.subjects ?? [],
  timetable: over.timetable ?? [],
  fading: over.fading ?? [],
  today: { xp: 0, answers: 0 },
});
const period = (done: boolean, mode: "review" | "quiz" = "review") => ({ kind: "class" as const, setId: SET, mode, why: { kind: "missed" as const, n: 2 }, done, set: { topic: "JavaScript", subtopic: "Fundamentals", category: "Programming" } });

test("your coach is the same every day for you, and someone else's for someone else", () => {
  assert.deepEqual(coachFor("lee_learner"), coachFor("lee_learner"));
  assert.notDeepEqual(coachFor("lee_learner"), coachFor("ada_author"));
});

test("a first visit is the tour, then the news; the report card is always an option", () => {
  const lines = coachLines(campus({ player: { coach: { heard: null, quiet: null, toured: false } }, timetable: [period(false)] }), "lee");
  assert.deepEqual(
    lines.map((l) => l.key),
    ["tour:1", "tour:2", "tour:3", `period:0:${SET}:review`, "report"],
  );
  assert.match(lines[0]?.text ?? "", /^Hi, I'm Coach \w+!/);
  assert.equal(lines[2]?.more, "What's on today?");
});

test("the next period: what, where, why and how long, and its class a tap away", () => {
  const [line] = coachLines(campus({ timetable: [period(true), period(false, "quiz")] }), "lee");
  assert.equal(line?.text, "Next on your timetable: Fundamentals, in Programming. 2 things you missed are due back. Quiz, about 3 minutes.");
  assert.deepEqual(line?.act, { label: "Let's go", to: `/study-sets/${SET}/quiz` });
});

test("back after days away comes first, without shaming, with the easiest way back in", () => {
  const lines = coachLines(
    campus({ player: { away: { days: 4, endedStreak: 6 } }, timetable: [period(false)], subjects: [{ category: "Programming", plot: 0, started: 1, mastery: 0.2, missed: 0, lastAt: null, status: "cold", sets: 2 }], fading: [{ category: "Programming", count: 3 }] }),
    "lee",
  );
  assert.equal(lines[0]?.text, "Welcome back! You were away 4 days. 1 building went cold and 3 player cards started fading. Your 6-day streak ended, but one class today starts a new one.");
  assert.equal(lines[0]?.act?.label, "Ease back in");
});

test("a class left halfway today: carried on in its round", () => {
  const lines = coachLines(campus({ player: { classLeft: { setId: SET, key: "quiz:2:abc", day: DAY, mode: "quiz", subtopic: "Fundamentals", index: 2, of: 5 } } }), "lee");
  assert.equal(lines[0]?.text, "You left Fundamentals halfway, at 2 of 5 answered. Pick it up where you were?");
  assert.deepEqual(lines[0]?.act, { label: "Carry on", to: `/study-sets/${SET}/quiz?round=2` });
});

test("a timetable done rings the bell; fading cards say where; nothing at all is a quiet day", () => {
  const done = coachLines(campus({ timetable: [period(true)], fading: [{ category: "Biology", count: 1 }, { category: "Programming", count: 4 }] }), "lee");
  assert.deepEqual(
    done.map((l) => l.key),
    ["timetable-done", "fading:5", "report"],
  );
  assert.equal(done[1]?.text, "5 of your player cards are fading, most in Programming. Studying there brings them back to full strength.");
  assert.deepEqual(
    coachLines(campus(), "lee").map((l) => l.key),
    ["quiet", "report"],
  );
});

test("news is a first line you haven't been told today", () => {
  assert.equal(isNews(null, DAY, "period:0:x"), true);
  assert.equal(isNews(`${DAY}|period:0:x`, DAY, "period:0:x"), false);
  assert.equal(isNews("2026-11-26|period:0:x", DAY, "period:0:x"), true, "yesterday's isn't today's");
  assert.equal(isNews(null, DAY, undefined), false);
});
