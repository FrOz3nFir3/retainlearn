import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUND_POINTS, mixedQuestions, nextRound, orderedCards, reviewLoad, roundState, setRounds, shortTopic, topicName, upNext } from "@retainlearn/core";
import { IST, cardsFirst, makeSet, noon, reviewedFirst } from "./helpers.ts";

const today = { today: "2026-11-24", timeZone: IST };
const whole = () => 4; // every flashcard reviewed whole: 4 recall points of effort

test("a flashcard with fewer than two recall points is reviewed whole, which counts as four", () => {
  assert.deepEqual([0, 1, 2, 7].map(reviewLoad), [4, 4, 2, 7]);
});

test("your own flashcard order comes first, then any the author added since, in the set's order", () => {
  const cards = [{ _id: "a" }, { _id: "b" }, { _id: "c" }, { _id: "d" }];
  assert.deepEqual(orderedCards(cards, ["c", "a", "gone"]).map((c) => c._id), ["c", "a", "b", "d"]);
  assert.deepEqual(orderedCards(cards, null).map((c) => c._id), ["a", "b", "c", "d"]);
});

test("a round closes at about five questions or sixteen recall points, and a short last round joins the one before", () => {
  // One question per flashcard, each reviewed whole (4 points): a round closes at 4 flashcards (16 points). One left
  // over is short (under 3 questions and 8 points), so it joins; two left over (8 points) make a round of their own.
  const shape = (flashcards: number) =>
    setRounds(makeSet("s", "Programming", flashcards, flashcards), null, whole).map((r) => [r.n, r.cardIds.length, r.questions.length, r.load]);
  assert.deepEqual(shape(5), [[1, 5, 5, 20]]);
  assert.deepEqual(shape(6), [
    [1, 4, 4, 16],
    [2, 2, 2, 8],
  ]);

  // 10 flashcards with two questions each: a round closes once it has 5 questions (3 flashcards, 6 questions), and
  // the tenth flashcard's 2 questions are short, so they join the third round.
  const big = makeSet("b", "Programming", 10, 20);
  const bigRounds = setRounds(big, null, () => 1);
  assert.deepEqual(bigRounds.map((r) => r.questions.length), [6, 6, 8]);
  assert.ok(bigRounds.every((r) => r.load < ROUND_POINTS));
});

test("each question goes in its flashcard's round; ones linked to no flashcard of the set make rounds at the end", () => {
  const set = { flashcards: [{ _id: "f1" }, { _id: "f2" }], questions: [{ _id: "q1", flashcardId: "f2" }, { _id: "q2", flashcardId: null }, { _id: "q3", flashcardId: "elsewhere" }] };
  const rounds = setRounds(set, null, whole);
  assert.deepEqual(rounds.map((r) => [r.cardIds, r.questions.map((q) => q._id)]), [[["f1", "f2"], ["q1"]], [[], ["q2", "q3"]]]);
});

test("where a round stands: reviewed, right, missed to retry, untried, stars and fading", () => {
  const set = makeSet("s", "Programming", 4, 4);
  const [round] = setRounds(set, null, whole);
  assert.ok(round);
  const fresh = roundState(round, null, today);
  assert.deepEqual([fresh.tried, fresh.stars, fresh.untried, fresh.reviewed], [false, 0, 4, 0]);

  const questions = { ...cardsFirst(set, 3, 1, "2026-11-23"), "s-q3": { level: 1, refreshedAt: noon("2026-11-23"), missedOn: "2026-11-24" } };
  const state = roundState(round, { flashcards: reviewedFirst(set, 2, "2026-11-24"), questions }, today);
  assert.deepEqual(
    { right: state.right, retry: state.retry, untried: state.untried, stars: state.stars, reviewed: state.reviewed, weak: state.weak },
    { right: 2, retry: 1, untried: 1, stars: 1, reviewed: 2, weak: 2 },
  );
  // Remembered 5 days ago at level 1 (fresh for 1 day): fading.
  assert.equal(roundState(round, { questions: cardsFirst(set, 1, 1, "2026-11-19") }, today).fading, true);
});

test("what's next: review a round, then quiz it, then the next round; a quiz from outside replays the weakest round", () => {
  const set = makeSet("s", "Programming", 8, 8);
  const rounds = setRounds(set, null, whole);
  assert.equal(rounds.length, 2);
  const stateWith = (progress: Parameters<typeof roundState>[1]) => rounds.map((r) => roundState(r, progress, today));

  assert.deepEqual(upNext(rounds, stateWith(null)), { round: rounds[0], mode: "review" });
  const reviewed = { flashcards: reviewedFirst(set, 4) };
  assert.deepEqual(upNext(rounds, stateWith(reviewed)), { round: rounds[0], mode: "quiz" });
  const quizzed = { ...reviewed, questions: cardsFirst(set, 4, 1, "2026-11-24") };
  assert.deepEqual(upNext(rounds, stateWith(quizzed)), { round: rounds[1], mode: "review" });

  const allRight = stateWith({ flashcards: reviewedFirst(set, 8), questions: cardsFirst(set, 8, 1, "2026-11-24") });
  assert.equal(upNext(rounds, allRight), null);
  assert.equal(nextRound(rounds, allRight), null, "nothing left untried");
  const oneMissed = stateWith({ questions: { ...cardsFirst(set, 8, 1, "2026-11-24"), "s-q6": { level: 1, refreshedAt: noon("2026-11-24"), missedOn: "2026-11-24" } } });
  assert.equal(nextRound(rounds, oneMissed, true), rounds[1], "replay: the round with fewer stars");
});

test("a mixed quiz: player cards from across the set, fading first, at most two a round, never one remembered today", () => {
  const set = makeSet("s", "Programming", 12, 12);
  const rounds = setRounds(set, null, whole); // 3 rounds of 4
  const questions = {
    ...cardsFirst(set, 12, 3, "2026-11-20"), // remembered 4 days ago at level 3 (fresh for 7): not fading
    "s-q1": { level: 1, refreshedAt: noon("2026-11-20"), missedOn: null }, // fading (fresh for 1 day)
    "s-q5": { level: 2, refreshedAt: noon("2026-11-24"), missedOn: null }, // remembered today: left out
    "s-q9": { level: 2, refreshedAt: noon("2026-11-10"), missedOn: "2026-11-23" }, // missed: for Retry
  };
  const mix = mixedQuestions(rounds, { questions }, today, 5, () => 0);
  assert.equal(mix[0]?._id, "s-q1", "the fading card comes first");
  assert.equal(mix.length, 5);
  assert.ok(!mix.some((q) => q._id === "s-q5" || q._id === "s-q9"));
  const perRound = rounds.map((r) => mix.filter((q) => r.questions.includes(q)).length);
  assert.ok(perRound.every((n) => n <= 2), `at most two a round: ${perRound}`);
});

test("a flashcard's question as a topic: the instruction around it goes, and the short form stops at the first clause", () => {
  assert.equal(topicName("Provide a detailed explanation of var, let and const, with examples"), "Var, let and const, with examples");
  assert.equal(topicName("Explain the event loop"), "Event loop");
  assert.equal(shortTopic("Based on the ECMAScript specification, explain the difference between null and undefined? Give examples."), "Difference between null and undefined");
});
