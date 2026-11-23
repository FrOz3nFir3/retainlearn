import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_RECALL_POINTS, answerQuestion, applyAnswers, linkedQuestionIds, refreshPlayerCard, reviewFlashcard } from "@retainlearn/core";
import { IST, noon } from "./helpers.ts";

const inIndia = (at: Date) => ({ at, timeZone: IST });

test("getting a question right for the first time earns a player card at level 1", () => {
  assert.deepEqual(answerQuestion(undefined, true, inIndia(noon("2026-11-20"))), {
    level: 1,
    refreshedAt: noon("2026-11-20"),
    right: 1,
    missedOn: null,
  });
});

test("a card moves up a level only when you remember it on a later day, up to level 5", () => {
  let q = answerQuestion(undefined, true, inIndia(noon("2026-11-20")));
  q = answerQuestion(q, true, inIndia(new Date("2026-11-20T12:00:00Z"))); // 17:30 the same day in India
  assert.equal(q.level, 1);
  assert.equal(q.right, 2);
  for (const day of ["2026-11-21", "2026-11-23", "2026-11-30", "2026-12-16", "2027-01-20"]) q = answerQuestion(q, true, inIndia(noon(day)));
  assert.equal(q.level, 5);
});

test("a miss drops a card a level, never below 1, and puts the question on what you missed today", () => {
  const was = { level: 3, refreshedAt: noon("2026-11-10"), right: 3, wrong: 0, missedOn: null };
  assert.deepEqual(answerQuestion(was, false, inIndia(noon("2026-11-20"))), {
    level: 2,
    refreshedAt: noon("2026-11-10"),
    right: 3,
    wrong: 1,
    missedOn: "2026-11-20",
  });
  assert.equal(answerQuestion({ level: 1, refreshedAt: noon("2026-11-10") }, false, inIndia(noon("2026-11-20"))).level, 1);
  assert.deepEqual(answerQuestion(undefined, false, inIndia(noon("2026-11-20"))), { level: 0, wrong: 1, missedOn: "2026-11-20" });
});

test("getting a missed question right takes it off what you missed", () => {
  assert.deepEqual(answerQuestion({ level: 0, wrong: 1, missedOn: "2026-11-19" }, true, inIndia(noon("2026-11-20"))), {
    level: 1,
    refreshedAt: noon("2026-11-20"),
    right: 1,
    wrong: 1,
    missedOn: null,
  });
});

test("the day turns over where the player is", () => {
  const was = { level: 1, refreshedAt: new Date("2026-11-20T18:00:00Z") }; // 23:30 on the 20th in India
  const at = new Date("2026-11-20T19:00:00Z"); // 00:30 on the 21st in India, but still the 20th in UTC
  assert.equal(answerQuestion(was, true, { at, timeZone: IST }).level, 2);
  assert.equal(answerQuestion(was, true, { at, timeZone: "UTC" }).level, 1);
  assert.equal(answerQuestion(was, false, { at, timeZone: IST }).missedOn, "2026-11-21");
});

test("a reviewed flashcard is seen, goes on what you missed unless you recalled all of it, and keeps one mark per recall point", () => {
  let f = reviewFlashcard(undefined, false, {
    ...inIndia(noon("2026-11-20")),
    points: [
      { key: "a", knew: true },
      { key: "b", knew: false },
    ],
  });
  assert.equal(f.missedOn, "2026-11-20");
  assert.deepEqual(f.seenAt, noon("2026-11-20"));
  f = reviewFlashcard(f, true, { ...inIndia(noon("2026-11-22")), points: [{ key: "b", knew: true }] });
  assert.equal(f.missedOn, null);
  assert.deepEqual(f.seenAt, noon("2026-11-22"));
  assert.deepEqual(f.points, [
    { key: "a", knew: true, at: noon("2026-11-20") },
    { key: "b", knew: true, at: noon("2026-11-22") },
  ]);
});

test("a flashcard keeps its latest 30 recall marks, so keys left by an edited answer don't pile up", () => {
  const marks = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ key: `p${from + i}`, knew: true }));
  let f = reviewFlashcard(undefined, true, { ...inIndia(noon("2026-11-20")), points: marks(0, 30) });
  f = reviewFlashcard(f, true, { ...inIndia(noon("2026-11-21")), points: [...marks(30, 5), { key: "p0", knew: false }] });
  assert.equal(f.points?.length, MAX_RECALL_POINTS);
  assert.deepEqual(f.points?.slice(0, 2).map((p) => p.key), ["p6", "p7"], "the oldest marks went first");
  assert.deepEqual(f.points?.at(-1), { key: "p0", knew: false, at: noon("2026-11-21") }, "marked again: kept, as the newest");
});

test("recalling a flashcard whole refreshes its linked questions' player cards, and only player cards", () => {
  const was = { level: 2, refreshedAt: noon("2026-11-10"), right: 2, missedOn: null };
  assert.deepEqual(refreshPlayerCard(was, inIndia(noon("2026-11-20"))), { ...was, level: 3, refreshedAt: noon("2026-11-20") });
  const sameDay = new Date("2026-11-10T12:00:00Z");
  assert.deepEqual(refreshPlayerCard(was, inIndia(sameDay)), { ...was, refreshedAt: sameDay }, "the same day: refreshed, not moved up");
  const notACard = { level: 0, wrong: 1, missedOn: "2026-11-19" };
  assert.equal(refreshPlayerCard(notACard, inIndia(noon("2026-11-20"))), notACard);
  assert.equal(refreshPlayerCard(undefined, inIndia(noon("2026-11-20"))), undefined);
});

test("a flashcard's linked questions are the ones that name it, whatever form the ids take", () => {
  const objectId = (hex: string) => ({ toString: () => hex });
  const set = {
    questions: [
      { _id: "q1", flashcardId: "f1" },
      { _id: "q2", flashcardId: "f2" },
      { _id: "q3" },
      { _id: objectId("q4"), flashcardId: objectId("f1") },
    ],
  };
  assert.deepEqual(linkedQuestionIds(set, "f1"), ["q1", "q4"]);
  assert.deepEqual(linkedQuestionIds(set, objectId("f2")), ["q2"]);
  assert.deepEqual(linkedQuestionIds(set, "f9"), []);
});

test("a batch of answers changes only the items it touched, earns cards and XP, and refreshes the cards of known flashcards", () => {
  const set = { questions: [{ _id: "q1", flashcardId: "f1" }, { _id: "q2", flashcardId: "f2" }, { _id: "q3" }] };
  const p = {
    questions: {
      q1: { level: 2, refreshedAt: noon("2026-11-10"), right: 2, wrong: 0, missedOn: null },
      q2: { level: 0, wrong: 1, missedOn: "2026-11-19" },
    },
  };
  const four = ["a", "b", "c", "d"].map((key) => ({ key, knew: true }));
  const result = applyAnswers(
    p,
    set,
    [
      { kind: "question", itemId: "q2", correct: true }, // a new player card
      { kind: "question", itemId: "q3", correct: false }, // missed
      { kind: "flashcard", itemId: "f1", knew: false, points: [...four, { key: "e", knew: false }] }, // 4 of 5: known
    ],
    inIndia(noon("2026-11-20")),
  );
  assert.deepEqual(Object.keys(result.questions).sort(), ["q1", "q2", "q3"]);
  assert.equal(result.questions.q2?.level, 1);
  assert.equal(result.questions.q3?.missedOn, "2026-11-20");
  assert.equal(result.questions.q1?.level, 3, "f1 was known, so the card of its linked question moved up");
  assert.deepEqual(Object.keys(result.flashcards), ["f1"]);
  assert.equal(result.flashcards.f1?.missedOn, null);
  assert.equal(result.earned, 1);
  assert.equal(result.xp, 12 + 3 + (4 + 2 * 5));
  assert.equal(p.questions.q2.level, 0, "the progress it was given is left alone");
});

test("answering the same question twice in one batch builds on the first answer", () => {
  const result = applyAnswers(
    undefined,
    { questions: [{ _id: "q1" }] },
    [
      { kind: "question", itemId: "q1", correct: false },
      { kind: "question", itemId: "q1", correct: true },
    ],
    inIndia(noon("2026-11-20")),
  );
  assert.deepEqual(result.questions.q1, { level: 1, refreshedAt: noon("2026-11-20"), right: 1, wrong: 1, missedOn: null });
  assert.equal(result.earned, 1);
});
