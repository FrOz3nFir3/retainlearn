// A guest's classes, kept on the device and sent once they sign in: each test is a rule written as an example.
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { SaveAnswersBody } from "@retainlearn/core";
import { Refused } from "./classSaver.ts";
import { KEEP_MS, MAX_SITTINGS, keepGuestBatch, keptClasses, sendKept } from "./guestClasses.ts";

// The browser's localStorage, in memory (or refusing everything, as a blocked one does).
function storage(blocked = false): Storage {
  const items = new Map<string, string>();
  const refuse = () => {
    if (blocked) throw new Error("SecurityError");
  };
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    key: (i: number) => [...items.keys()][i] ?? null,
    getItem: (key: string) => (refuse(), items.get(key) ?? null),
    setItem: (key: string, value: string) => (refuse(), void items.set(key, value)),
    removeItem: (key: string) => void items.delete(key),
  };
}
const useStorage = (s: Storage) => Object.defineProperty(globalThis, "localStorage", { value: s, configurable: true, writable: true });
beforeEach(() => useStorage(storage()));

const SET = "0".repeat(23) + "1";
const OTHER = "0".repeat(23) + "2";
const batch = (classKey: string, seq: number, finished = false): SaveAnswersBody => ({
  timeZone: "Asia/Kolkata",
  classKey,
  mode: "quiz",
  seq,
  answers: [{ kind: "question", itemId: `${seq}`.padStart(24, "0"), correct: true, ms: 900 }],
  finished,
});
const seqs = (setId = SET) => keptClasses().find((s) => s.setId === setId)?.batches.map((b) => b.seq);

test("a guest's batches are kept by sitting, and a batch number only once", () => {
  keepGuestBatch(SET, batch("quiz:1:a", 1));
  keepGuestBatch(SET, batch("quiz:1:a", 2, true));
  keepGuestBatch(SET, batch("quiz:1:a", 2, true)); // sent again (the page hidden, then the class finished)
  keepGuestBatch(SET, batch("quiz:2:b", 1));
  assert.equal(keptClasses().length, 2);
  assert.deepEqual(seqs(), [1, 2]);
});

test("kept for a day at most, and only the last few sittings", () => {
  const start = Date.now();
  keepGuestBatch(SET, batch("quiz:1:old", 1), start - KEEP_MS);
  keepGuestBatch(SET, batch("quiz:1:new", 1), start);
  assert.deepEqual(
    keptClasses(start).map((s) => s.batches[0]?.classKey),
    ["quiz:1:new"],
  );
  for (let i = 0; i < MAX_SITTINGS + 3; i++) keepGuestBatch(SET, batch(`quiz:1:${i}`, 1), start + i);
  const kept = keptClasses(start + MAX_SITTINGS + 3);
  assert.equal(kept.length, MAX_SITTINGS);
  assert.equal(kept.at(-1)?.batches[0]?.classKey, `quiz:1:${MAX_SITTINGS + 2}`);
});

test("once signed in, each sitting goes to the account in order, then is forgotten", async () => {
  keepGuestBatch(SET, batch("quiz:1:a", 2, true));
  keepGuestBatch(SET, batch("quiz:1:a", 1)); // a batch sent at once when the page was hidden, ahead of its turn
  keepGuestBatch(OTHER, batch("review:1:b", 1, true));
  const sent: string[] = [];
  const done = await sendKept(async (setId, b) => void sent.push(`${setId === SET ? "set" : "other"} ${b.classKey} ${b.seq}`));
  assert.deepEqual(sent, ["set quiz:1:a 1", "set quiz:1:a 2", "other review:1:b 1"]);
  assert.equal(done.length, 2);
  assert.deepEqual(keptClasses(), []);
});

test("a sitting the server turns away is forgotten; one that couldn't be sent is kept for next time", async () => {
  keepGuestBatch(SET, batch("quiz:1:gone", 1, true));
  keepGuestBatch(SET, batch("quiz:1:later", 1, true));
  keepGuestBatch(SET, batch("quiz:1:after", 1, true));
  const done = await sendKept(async (_setId, b) => {
    if (b.classKey === "quiz:1:gone") throw new Refused("404");
    if (b.classKey === "quiz:1:later") throw new TypeError("Failed to fetch");
  });
  assert.equal(done.length, 0);
  assert.deepEqual(
    keptClasses().map((s) => s.batches[0]?.classKey),
    ["quiz:1:later", "quiz:1:after"],
  );
});

test("one send at a time: a second call while one runs gets the same one", async () => {
  keepGuestBatch(SET, batch("quiz:1:a", 1, true));
  let calls = 0;
  let release = () => {};
  const send = () => {
    calls++;
    return new Promise<void>((resolve) => (release = resolve));
  };
  const first = sendKept(send);
  const second = sendKept(send);
  assert.equal(first, second);
  release();
  await first;
  assert.equal(calls, 1);
  // Over, so the next call is a new run.
  assert.deepEqual(await sendKept(send), []);
});

test("storage blocked: the class just isn't kept", async () => {
  useStorage(storage(true));
  assert.doesNotThrow(() => keepGuestBatch(SET, batch("quiz:1:a", 1, true)));
  assert.deepEqual(keptClasses(), []);
  assert.deepEqual(await sendKept(async () => {}), []);
});
