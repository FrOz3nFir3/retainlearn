import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASSES_A_DAY, planDay } from "@retainlearn/core";
import type { Progress, StudySet } from "@retainlearn/core";
import { IST, cardsFirst, makeSet, noon, reviewedFirst, seen } from "./helpers.ts";

const today = "2026-11-21";
const plan = (sets: StudySet[], progress: Record<string, Progress>, subjects: string[]) => planDay({ sets, progress, subjects, today, timeZone: IST });
const briefly = (periods: ReturnType<typeof planDay>) => periods.map((p) => [p.setId, p.mode, p.why]);

const js1 = makeSet("js1", "Programming", 10, 10);
const js2 = makeSet("js2", "Programming", 10, 10);
const phy = makeSet("phy", "Physics", 10, 10);
const chem = makeSet("chem", "Chemistry", 6, 6);
const blank = makeSet("blank", "Chemistry", 0, 0);

test("what you missed before today comes first; today's misses wait a day", () => {
  const progress = {
    js1: {
      flashcards: { "js1-f1": seen("2026-11-20"), "js1-f2": seen("2026-11-21") },
      questions: { "js1-q1": { level: 0, wrong: 1, missedOn: "2026-11-19" } },
      lastAt: noon(today),
    },
    phy: { flashcards: { "phy-f1": seen("2026-11-21") }, lastAt: noon(today) },
  };
  assert.deepEqual(plan([js1, js2, phy], progress, ["Programming", "Physics"]), [
    { kind: "class", setId: "js1", mode: "reviewMissed", why: { kind: "missed", n: 2 }, done: false },
    { kind: "class", setId: "phy", mode: "review", why: { kind: "continue", n: 1, of: 10 }, done: false },
  ]);
});

test("fading player cards count 2 each, and a set you've been away from for 3 days or more climbs 2 a day", () => {
  const progress = {
    js1: { flashcards: reviewedFirst(js1, 1), lastAt: noon("2026-11-16") }, // 5 days away: 10
    phy: { questions: cardsFirst(phy, 6, 1, "2026-11-18"), lastAt: noon("2026-11-20") }, // 6 fading: 12
  };
  assert.deepEqual(briefly(plan([js1, phy], progress, ["Programming", "Physics"])), [
    ["phy", "quiz", { kind: "fading", n: 6 }],
    ["js1", "review", { kind: "cold", n: 5 }],
  ]);
});

test("a quiet set climbs to 40 at most, so plenty of fading cards still come first", () => {
  const big = makeSet("big", "Physics", 0, 25);
  const progress = {
    js1: { flashcards: reviewedFirst(js1, 1), lastAt: noon("2026-10-22") }, // 30 days away: 60, held to 40
    big: { questions: cardsFirst(big, 21, 1, "2026-11-18"), lastAt: noon("2026-11-20") }, // 21 fading: 42
  };
  assert.deepEqual(briefly(plan([js1, big], progress, ["Programming", "Physics"])), [
    ["big", "quiz", { kind: "fading", n: 21 }],
    ["js1", "review", { kind: "cold", n: 30 }],
  ]);
});

test("a subject you've never started gets introduced, and the second class goes to another subject", () => {
  const progress = {
    js1: { flashcards: reviewedFirst(js1, 4, "2026-11-20"), lastAt: noon(today) }, // 4 due back: 12
    js2: { flashcards: reviewedFirst(js2, 3, "2026-11-20"), lastAt: noon(today) }, // 3 due back: 9, but x0.6 once Programming is on
  };
  assert.deepEqual(briefly(plan([js1, js2, chem, blank], progress, ["Programming", "Chemistry"])), [
    ["js1", "reviewMissed", { kind: "missed", n: 4 }],
    ["chem", "review", { kind: "new" }], // 10, ahead of js2's 5.4
  ]);
});

test("a set with only missed questions due gets a retry", () => {
  const progress = { js1: { questions: { "js1-q3": { level: 1, refreshedAt: noon("2026-11-19"), right: 1, wrong: 1, missedOn: "2026-11-20" } }, lastAt: noon(today) } };
  assert.deepEqual(briefly(plan([js1], progress, ["Programming"])), [["js1", "retryMissed", { kind: "missed", n: 1 }]]);
});

test("with nothing pressing, it carries on where you're furthest through, in another subject first", () => {
  const progress = {
    js1: { flashcards: reviewedFirst(js1, 6), lastAt: noon(today) },
    js2: { flashcards: reviewedFirst(js2, 2), lastAt: noon(today) },
    phy: { flashcards: reviewedFirst(phy, 1), lastAt: noon(today) },
  };
  assert.deepEqual(briefly(plan([js1, js2, phy], progress, ["Programming", "Physics"])), [
    ["js1", "review", { kind: "continue", n: 6, of: 10 }],
    ["phy", "review", { kind: "continue", n: 1, of: 10 }], // before js2, though js2 is further through
  ]);
});

test("empty sets, sets outside your subjects and finished sets are never picked, so the timetable can be short", () => {
  assert.deepEqual(plan([blank], {}, ["Chemistry"]), []);
  assert.deepEqual(plan([js1, phy], {}, ["Chemistry"]), []);
  const finished = { js1: { flashcards: reviewedFirst(js1, 10), questions: cardsFirst(js1, 10, 2, "2026-11-20"), lastAt: noon(today) } };
  assert.deepEqual(plan([js1], finished, ["Programming"]), []);
});

test(`never more than ${CLASSES_A_DAY} classes a day`, () => {
  const sets = [js1, js2, phy, chem];
  const progress = Object.fromEntries(sets.map((s) => [s._id, { flashcards: reviewedFirst(s, 2, "2026-11-19"), lastAt: noon(today) }]));
  assert.equal(plan(sets, progress, ["Programming", "Physics", "Chemistry"]).length, CLASSES_A_DAY);
});
