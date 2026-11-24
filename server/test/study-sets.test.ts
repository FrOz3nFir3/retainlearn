// Studying a set (P1-07, PLAN 14.10): its content in the new names, your progress in it, and saving a class's answers.
// They're saved in batches, safe to send twice, logged, and counted in today's activity. At a class's end come the
// streak and the campus's summary.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { dayKey } from "@retainlearn/core";
import type { ProgressView, SavedAnswers, StudySetContent } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import Answer from "#models/answers/answers.mongo.ts";
import Activity from "#models/activity/activity.mongo.ts";
import Player from "#models/players/players.mongo.ts";
import type { PlayerDoc } from "#models/players/players.mongo.ts";
import Progress from "#models/progress/progress.mongo.ts";
import Cards from "#models/cards/cards.mongo.js";

const IST = "Asia/Kolkata";
const js = String(ids.js);
const constCard = String(ids.constCard);

let t: Awaited<ReturnType<typeof startApi>>;
let lee: Record<string, string>;
let questionId: string; // the JavaScript set's question (linked to constCard)
before(async () => {
  t = await startApi();
  lee = await t.signIn("lee_learner");
  questionId = ((await (await t.api(`/api/study-sets/${js}`)).json()) as StudySetContent).questions[0]!._id;
});
after(async () => {
  await t?.stop();
});

const save = (who: Record<string, string>, body: object) =>
  t.api(`/api/study-sets/${js}/answers`, { method: "POST", headers: who, body: JSON.stringify(body) });
const batch = (over: object) => ({ timeZone: IST, classKey: "quiz:round-1:a", mode: "quiz", seq: 1, ...over });

test("a set's content comes in the new names, for anyone", async () => {
  const res = await t.api(`/api/study-sets/${js}`);
  assert.equal(res.status, 200);
  const set = (await res.json()) as StudySetContent;
  assert.deepEqual(
    { topic: set.topic, subtopic: set.subtopic, category: set.category, listed: set.listed },
    { topic: "JavaScript", subtopic: "Fundamentals", category: "Programming", listed: true },
  );
  assert.ok(set.version > 0, "its version is its updatedAt");
  assert.deepEqual(set.flashcards.map((f: { _id: string }) => f._id), [constCard, String(ids.loopCard)]);
  assert.deepEqual(set.questions, [
    {
      _id: questionId,
      question: "<p>Can a <code>const</code> binding be reassigned?</p>",
      answer: "No",
      wrongAnswers: ["Yes", "Only inside a loop", "Only inside a function"],
      flashcardId: constCard,
    },
  ]);
  for (const old of ["main-topic", "review", "quizzes", "logs", "reviewQueue", "author"]) assert.equal(old in set, false, `no ${old}`);
});

test("a new account's set reads as listed once its day to be listed has come, as the category pages show it", async () => {
  const listed = async () => ((await (await t.api(`/api/study-sets/${ids.bio}`)).json()) as StudySetContent).listed;
  await Cards.updateOne({ _id: ids.bio }, { $set: { listed: false, listAt: new Date(Date.now() - 60_000) } });
  assert.equal(await listed(), true);
  await Cards.updateOne({ _id: ids.bio }, { $set: { listAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  assert.equal(await listed(), false);
  await Cards.updateOne({ _id: ids.bio }, { $unset: { listed: 1, listAt: 1 } });
});

test("an unknown set is a 404, and an id that isn't one is a 400 saying so", async () => {
  assert.equal((await t.api("/api/study-sets/000000000000000000000fff")).status, 404);
  const bad = await t.api("/api/study-sets/not-an-id");
  assert.equal(bad.status, 400);
  assert.deepEqual(await bad.json(), { error: "params.id: must be an id" });
});

test("your progress needs you signed in, and starts empty", async () => {
  assert.equal((await t.api(`/api/study-sets/${js}/progress`)).status, 401);
  const res = await t.api(`/api/study-sets/${js}/progress`, { headers: lee });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    setId: js,
    flashcards: {},
    questions: {},
    order: null,
    quiz: { started: 0, finished: 0 },
    classInProgress: null,
    lastAt: null,
  });
});

test("saving a batch applies the rules, changes only what it touched, earns XP, and logs each answer", async () => {
  const res = await save(
    lee,
    batch({
      answers: [
        { kind: "question", itemId: questionId, correct: true, ms: 3000 },
        { kind: "flashcard", itemId: constCard, knew: true, ms: 8000 },
      ],
      role: "admin", // a stray field: dropped
    }),
  );
  assert.equal(res.status, 200);
  const saved = (await res.json()) as SavedAnswers;
  assert.equal(saved.saved, true);
  assert.equal(saved.earned, 1, "a new player card");
  assert.equal(saved.xp, 12 + 6);
  assert.equal(saved.questions[questionId]?.level, 1);
  assert.ok(saved.flashcards[constCard]?.seenAt);
  assert.deepEqual(Object.keys(saved.flashcards), [constCard], "loopCard wasn't touched");

  const progress = (await (await t.api(`/api/study-sets/${js}/progress`, { headers: lee })).json()) as ProgressView;
  assert.equal(progress.questions[questionId]?.right, 1);
  assert.deepEqual(progress.classInProgress, { key: "quiz:round-1:a", mode: "quiz", day: dayKey(new Date(), IST), seq: 1 });
  assert.deepEqual(progress.quiz, { started: 1, finished: 0 });

  assert.equal(await Answer.countDocuments({ "meta.userId": ids.learner }), 2, "a question and a flashcard");
  const day = await Activity.findOne({ userId: ids.learner, day: dayKey(new Date(), IST) }).lean<{ answers: number; xp: number }>();
  assert.deepEqual({ answers: day?.answers, xp: day?.xp }, { answers: 2, xp: 18 });
  const player = await Player.findById(ids.learner).lean<{ xp: number; classLeft: { key: string } }>();
  assert.equal(player?.xp, 18);
  assert.equal(player?.classLeft.key, "quiz:round-1:a", "the coach can mention a class left halfway");
});

test("the same batch sent again changes nothing: no progress, no XP, no log", async () => {
  const again = await save(lee, batch({ answers: [{ kind: "question", itemId: questionId, correct: true, ms: 3000 }] }));
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), { saved: false, flashcards: {}, questions: {}, earned: 0, xp: 0 });
  assert.equal(await Answer.countDocuments({ "meta.userId": ids.learner }), 2);
  assert.equal((await Player.findById(ids.learner).lean<{ xp: number }>())?.xp, 18);
});

test("what doesn't fit is turned away with the reason", async () => {
  const reasonOf = async (res: Response) => ({ status: res.status, error: ((await res.json()) as { error: string }).error });
  const answers = [{ kind: "question", itemId: questionId, correct: true, ms: 1 }];
  assert.deepEqual(await reasonOf(await save(lee, batch({ seq: 9, mode: "battle", answers }))), {
    status: 400,
    error: 'body.mode: Invalid option: expected one of "review"|"quiz"|"reviewMissed"|"retryMissed"',
  });
  assert.deepEqual(await reasonOf(await save(lee, batch({ seq: 9, answers: [{ kind: "flashcard", itemId: String(ids.cellCard), knew: true, ms: 1 }] }))), {
    status: 400,
    error: `body.answers: ${ids.cellCard} isn't one of this set's flashcards`,
  });
  assert.equal((await t.api(`/api/study-sets/${js}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 401);
  const { "X-CSRF-Token": _csrf, ...noCsrf } = lee;
  assert.equal((await save(noCsrf, batch({ seq: 9, answers }))).status, 403);
});

test("a flashcard's recall points decide whether it's known, and each one is logged", async () => {
  const points = ["a", "b", "c", "d", "e"].map((key, i) => ({ key, knew: i < 3 })); // 3 of 5: not known
  const res = await save(lee, batch({ classKey: "review:round-1:b", mode: "review", answers: [{ kind: "flashcard", itemId: String(ids.loopCard), knew: true, points, ms: 9000 }] }));
  const saved = (await res.json()) as SavedAnswers;
  assert.equal(saved.flashcards[String(ids.loopCard)]?.missedOn, dayKey(new Date(), IST), "missed: only 3 of 5 recalled");
  assert.equal(saved.xp, 4 + 2 * 5);
  assert.equal(await Answer.countDocuments({ "meta.userId": ids.learner, item: ids.loopCard, kind: "point" }), 5);
});

test("finishing a class: the streak starts, the subject joins the campus, and the class isn't left halfway", async () => {
  const res = await save(lee, batch({ seq: 2, finished: true, answers: [{ kind: "question", itemId: questionId, correct: false, ms: 2000 }] }));
  const saved = (await res.json()) as SavedAnswers;
  assert.deepEqual(saved.finished, { streak: 1, firstToday: true, timetableDone: false });

  // The review started in the test before, and never finished, is still left halfway: only the quiz was finished.
  const player = await Player.findById(ids.learner).lean<PlayerDoc>();
  assert.equal(player?.streak?.count, 1);
  assert.equal(player?.classLeft?.key, "review:round-1:b");
  assert.deepEqual(
    player?.subjects.map(({ category, started, missed }) => ({ category, started, missed })),
    [{ category: "Programming", started: 1, missed: 2 }],
    "the question just missed, and loopCard",
  );
  const progress = (await (await t.api(`/api/study-sets/${js}/progress`, { headers: lee })).json()) as ProgressView;
  assert.equal(progress.classInProgress?.key, "review:round-1:b", "the review can still carry on");
  assert.deepEqual(progress.quiz, { started: 1, finished: 1 });

  // The finished batch sent again (its answer lost on the way back) changes nothing, even with the class closed.
  const resent = await save(lee, batch({ seq: 2, finished: true, answers: [{ kind: "question", itemId: questionId, correct: false, ms: 2000 }] }));
  assert.equal(((await resent.json()) as SavedAnswers).saved, false);

  // A second class the same day keeps the streak where it is.
  const second = await save(lee, batch({ classKey: "quiz:round-1:c", finished: true, answers: [{ kind: "question", itemId: questionId, correct: true, ms: 2000 }] }));
  assert.deepEqual(((await second.json()) as SavedAnswers).finished, { streak: 1, firstToday: false, timetableDone: false });
});

// Resetting a set's quizzes, from the report card's quiz report.
const tz = `tz=${encodeURIComponent(IST)}`;
const progressOf = async (setId = js) => (await (await t.api(`/api/study-sets/${setId}/progress`, { headers: lee })).json()) as ProgressView;
const resetQuiz = (setId = js, who: Record<string, string> = lee, query = tz) =>
  t.api(`/api/study-sets/${setId}/progress/quiz?${query}`, { method: "DELETE", headers: who });
const missedInSubject = async () => (await Player.findById(ids.learner).lean<PlayerDoc>())?.subjects.find((s) => s.category === "Programming")?.missed;

test("resetting a set's quizzes keeps your player cards and flashcards, and clears what you missed, the record and the count", async () => {
  // The question missed in a finished quiz: the review left halfway (above) stays left halfway.
  await save(lee, batch({ classKey: "quiz:round-1:d", finished: true, answers: [{ kind: "question", itemId: questionId, correct: false, ms: 2000 }] }));
  const before = await progressOf();
  assert.ok(before.questions[questionId]?.missedOn && (before.questions[questionId]?.level ?? 0) >= 1, "a player card, missed");
  assert.equal(await missedInSubject(), 2, "the question and loopCard");

  const res = await resetQuiz();
  assert.equal(res.status, 200);
  const view = (await res.json()) as ProgressView;
  const card = before.questions[questionId]!;
  assert.deepEqual(view.questions, { [questionId]: { level: card.level, refreshedAt: card.refreshedAt } }, "only the player card, with no record");
  assert.deepEqual(view.quiz, { started: 0, finished: 0 });
  assert.deepEqual(view.flashcards, before.flashcards);
  assert.equal(view.classInProgress?.key, "review:round-1:b", "a review left halfway isn't a quiz");
  assert.deepEqual(await progressOf(), view, "saved as it says");
  assert.equal(await missedInSubject(), 1, "the campus's summary refreshed: only loopCard is left missed");

  const again = await resetQuiz();
  assert.deepEqual(await again.json(), view, "resetting again changes nothing");
});

test("a quiz left halfway is dropped with the reset, since its answers so far are gone", async () => {
  await save(lee, batch({ classKey: "quiz:round-1:e", answers: [{ kind: "question", itemId: questionId, correct: true, ms: 2000 }] }));
  assert.equal((await progressOf()).classInProgress?.key, "quiz:round-1:e");
  const view = (await (await resetQuiz()).json()) as ProgressView;
  assert.equal(view.classInProgress, null);
});

test("the reset is for signed-in players and a set that's there, with the time zone; one you haven't started has nothing to reset", async () => {
  assert.equal((await resetQuiz(js, {})).status, 401);
  assert.equal((await resetQuiz(js, lee, "")).status, 400);
  assert.equal((await resetQuiz("000000000000000000000fff")).status, 404);
  const bio = String(ids.bio);
  const res = await resetQuiz(bio);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), await progressOf(bio));
  assert.equal(await Progress.exists({ userId: ids.learner, setId: ids.bio }), null, "no progress made for it");
});
