// The report card (PLAN 14.10): your progress in every set you've started, and your player's totals, in one call, for
// signed-in players. Reading it never makes a player.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { ReportCard, StudySetContent } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import Player from "#models/players/players.mongo.ts";

const IST = "Asia/Kolkata";
const js = String(ids.js);

let t: Awaited<ReturnType<typeof startApi>>;
let lee: Record<string, string>;
before(async () => {
  t = await startApi();
  lee = await t.signIn("lee_learner");
});
after(async () => {
  await t?.stop();
});

const reportCard = async (): Promise<ReportCard> => (await t.api(`/api/report-card?tz=${encodeURIComponent(IST)}`, { headers: lee })).json() as Promise<ReportCard>;

test("the report card is for signed-in players, with the browser's time zone", async () => {
  assert.equal((await t.api(`/api/report-card?tz=${encodeURIComponent(IST)}`)).status, 401);
  assert.equal((await t.api("/api/report-card", { headers: lee })).status, 400);
});

test("before any class it's empty, and reading it makes no player", async () => {
  assert.deepEqual(await reportCard(), { xp: 0, level: 1, streak: { count: 0, freezes: 0 }, subjects: 0, sets: [] });
  assert.equal(await Player.exists({ _id: ids.learner }), null);
});

test("after a class it lists the set with its titles, counts and progress, and the player's XP, streak and subjects", async () => {
  const set = (await (await t.api(`/api/study-sets/${js}`)).json()) as StudySetContent;
  const questionId = set.questions[0]!._id;
  const body = { timeZone: IST, classKey: "quiz:1:a", mode: "quiz", seq: 1, finished: true, answers: [{ kind: "question", itemId: questionId, correct: true, ms: 1000 }] };
  assert.equal((await t.api(`/api/study-sets/${js}/answers`, { method: "POST", headers: lee, body: JSON.stringify(body) })).status, 200);

  const card = await reportCard();
  assert.deepEqual({ level: card.level, streak: card.streak.count, subjects: card.subjects }, { level: 1, streak: 1, subjects: 1 });
  assert.ok(card.xp > 0);
  assert.equal(card.sets.length, 1);
  const [studied] = card.sets;
  assert.deepEqual(
    { setId: studied?.setId, category: studied?.category, topic: studied?.topic, subtopic: studied?.subtopic, flashcardCount: studied?.flashcardCount, questionCount: studied?.questionCount, quiz: studied?.quiz },
    { setId: js, category: "Programming", topic: "JavaScript", subtopic: "Fundamentals", flashcardCount: 2, questionCount: 1, quiz: { started: 1, finished: 1 } },
  );
  assert.equal(studied?.questions[questionId]?.level, 1);
  assert.ok(studied?.lastAt);
});
