// Saving a class's answers: in numbered batches, in order, the last one never empty, retried after a network error,
// and sent at once when the page is hidden. Each test is a rule written as an example.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SaveAnswersBody, SavedAnswers } from "@retainlearn/core";
import { ClassSaver, Refused, newClassKey } from "./classSaver.ts";

const saved = (over: Partial<SavedAnswers> = {}): SavedAnswers => ({ saved: true, flashcards: {}, questions: {}, earned: 0, xp: 1, ...over });
const answer = (i: number) => ({ kind: "question" as const, itemId: `${i}`.padStart(24, "0"), correct: true, ms: 1000 });
const sitting = { classKey: "quiz:1:abc", mode: "quiz" as const, timeZone: "Asia/Kolkata" };

function recorder(fail: (body: SaveAnswersBody, call: number) => Error | null = () => null) {
  const sent: { body: SaveAnswersBody; keepalive: boolean }[] = [];
  let calls = 0;
  const send = async (body: SaveAnswersBody, keepalive: boolean) => {
    const error = fail(body, calls++);
    if (error) throw error;
    sent.push({ body, keepalive });
    return saved();
  };
  return { sent, send };
}

test("answers go in numbered batches of five, and one is held back so the finished batch is never empty", async () => {
  const { sent, send } = recorder();
  const saver = new ClassSaver(send, sitting, { wait: async () => {} });
  for (let i = 1; i <= 11; i++) saver.record(answer(i));
  const last = await saver.finish();
  assert.ok(last?.saved);
  assert.deepEqual(
    sent.map(({ body }) => [body.seq, body.answers.length, body.finished]),
    [
      [1, 5, false],
      [2, 5, false],
      [3, 1, true],
    ],
  );
  assert.ok(sent.every(({ body }) => body.classKey === sitting.classKey && body.mode === "quiz"));
});

test("a class ending with no answers saves nothing", async () => {
  const { sent, send } = recorder();
  assert.equal(await new ClassSaver(send, sitting).finish(), null);
  assert.equal(sent.length, 0);
});

test("a batch that fails for the network is sent again with the same number; one the server turns away isn't", async () => {
  const { sent, send } = recorder((_body, call) => (call === 0 ? new TypeError("Failed to fetch") : null));
  const saver = new ClassSaver(send, sitting, { wait: async () => {} });
  saver.record(answer(1));
  saver.record(answer(2));
  await saver.finish();
  assert.deepEqual(sent.map(({ body }) => body.seq), [1], "retried as batch 1, not renumbered");

  const refused = recorder(() => new Refused("400"));
  const failures: unknown[] = [];
  const strict = new ClassSaver(refused.send, sitting, { wait: async () => {} });
  strict.onFailed = (e) => failures.push(e);
  strict.record(answer(1));
  await assert.rejects(strict.finish(), Refused);
  assert.equal(failures.length, 1);
});

test("when the page is hidden, what's waiting goes at once with keepalive, still holding one back, and numbering carries on", async () => {
  const { sent, send } = recorder();
  const saver = new ClassSaver(send, sitting, { wait: async () => {} });
  for (let i = 1; i <= 4; i++) saver.record(answer(i), { ids: [], index: i });
  saver.flushNow();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(sent.map(({ body, keepalive }) => [body.seq, body.answers.length, keepalive, body.resume?.index]), [[1, 3, true, 4]]);
  await saver.finish();
  assert.deepEqual(sent.at(-1)?.body.seq, 2);
  assert.deepEqual(sent.at(-1)?.body.finished, true);
});

test("a class carried on numbers its batches on from the last one saved, so none is taken for one sent before", async () => {
  const { sent, send } = recorder();
  const saver = new ClassSaver(send, sitting, { wait: async () => {}, afterSeq: 3 });
  saver.record(answer(1));
  await saver.finish();
  assert.deepEqual(sent.map(({ body }) => body.seq), [4]);
});

test("a sitting's key says the kind of class and its round, and is new each time", () => {
  assert.equal(newClassKey("review", 2, 1_700_000_000_000), "review:2:loyw3v28");
  assert.notEqual(newClassKey("quiz", 1, 1), newClassKey("quiz", 1, 2));
});
