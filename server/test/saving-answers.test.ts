// Saving a class's answers when the network misbehaves or two devices are in use (the P1-07 check-up): two saves at
// the same moment don't undo each other, a batch that arrives late still counts without moving the class back, one
// sent twice counts once, and two classes finished at the same moment keep both subjects and count the streak once.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { ProgressView, SavedAnswers, StudySetContent } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import Player from "#models/players/players.mongo.ts";
import type { PlayerDoc } from "#models/players/players.mongo.ts";

const IST = "Asia/Kolkata";
const js = String(ids.js);
const bio = String(ids.bio);

let t: Awaited<ReturnType<typeof startApi>>;
let lee: Record<string, string>;
let questionId: string; // the JavaScript set's only question
before(async () => {
  t = await startApi();
  lee = await t.signIn("lee_learner");
  questionId = ((await (await t.api(`/api/study-sets/${js}`)).json()) as StudySetContent).questions[0]!._id;
});
after(async () => {
  await t?.stop();
});

const save = async (setId: string, body: object): Promise<SavedAnswers> =>
  (await t.api(`/api/study-sets/${setId}/answers`, { method: "POST", headers: lee, body: JSON.stringify({ timeZone: IST, mode: "quiz", ...body }) })).json() as Promise<SavedAnswers>;
const progressOf = async (setId: string): Promise<ProgressView> =>
  (await t.api(`/api/study-sets/${setId}/progress`, { headers: lee })).json() as Promise<ProgressView>;
const answer = (correct: boolean) => [{ kind: "question", itemId: questionId, correct, ms: 1000 }];
const player = () => Player.findById(ids.learner).lean<PlayerDoc>();

test("two saves at the same moment, on a set never studied, both count", async () => {
  const both = await Promise.all([save(js, { classKey: "quiz:a", seq: 1, answers: answer(true) }), save(js, { classKey: "quiz:b", seq: 1, answers: answer(true) })]);
  assert.deepEqual(both.map((s) => s.saved), [true, true]);
  assert.equal((await progressOf(js)).questions[questionId]?.right, 2, "neither answer was lost");
});

test("a batch that arrives late still counts, but where the class stands stays at the newest batch", async () => {
  await save(js, { classKey: "quiz:c", seq: 1, answers: answer(true), resume: { ids: [questionId], index: 1 } });
  await save(js, { classKey: "quiz:c", seq: 3, answers: answer(true), resume: { ids: [questionId], index: 3 } });
  const late = await save(js, { classKey: "quiz:c", seq: 2, answers: answer(false), resume: { ids: [questionId], index: 2 } });
  assert.equal(late.saved, true, "batch 2 had never been saved");

  const p = await progressOf(js);
  assert.equal(p.questions[questionId]?.wrong, 1);
  assert.deepEqual([p.classInProgress?.seq, p.classInProgress?.index], [3, 3]);
  for (const seq of [1, 2, 3]) assert.equal((await save(js, { classKey: "quiz:c", seq, answers: answer(true) })).saved, false, `batch ${seq} sent again`);
});

test("two classes finished at the same moment, in two subjects, keep both subjects and count the streak once", async () => {
  const flashcard = [{ kind: "flashcard", itemId: String(ids.cellCard), knew: true, ms: 1000 }];
  const both = await Promise.all([
    save(js, { classKey: "quiz:d", seq: 1, finished: true, answers: answer(true) }),
    save(bio, { classKey: "review:e", mode: "review", seq: 1, finished: true, answers: flashcard }),
  ]);
  assert.equal(both.filter((s) => s.finished?.firstToday).length, 1, "only one of them was the day's first class");
  const now = await player();
  assert.deepEqual(now?.subjects?.map((s) => s.category).sort(), ["Biology", "Programming"]);
  assert.equal(now?.streak?.count, 1);
});

test("a batch that arrives after its class's last one counts, without reopening the class", async () => {
  await save(js, { classKey: "quiz:f", seq: 1, answers: answer(true) });
  await save(js, { classKey: "quiz:f", seq: 3, finished: true, answers: answer(true) });
  const late = await save(js, { classKey: "quiz:f", seq: 2, answers: answer(true) });
  assert.equal(late.saved, true);
  assert.equal((await progressOf(js)).classInProgress, null);
  assert.equal((await player())?.classLeft, null, "the coach won't mention a class left halfway");
});
