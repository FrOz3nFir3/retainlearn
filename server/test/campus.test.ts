// The campus (P1-07, PLAN 14.10): one call for everything it shows. The player is made at the first visit, with its
// subjects from the progress already there (the copy from the old app). Today's timetable is drawn up at the day's
// first load and kept; finishing its classes ticks them off, and finishing them all gives the bonus, once.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { dayKey } from "@retainlearn/core";
import type { Campus, SavedAnswers } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids, PASSWORD } from "./fixtures.js";
import Player from "#models/players/players.mongo.ts";
import Progress from "#models/progress/progress.mongo.ts";
import Users from "#models/users/users.mongo.js";

const IST = "Asia/Kolkata";
const js = String(ids.js);

let t: Awaited<ReturnType<typeof startApi>>;
let lee: Record<string, string>;
let ada: Record<string, string>;
before(async () => {
  t = await startApi();
  lee = await t.signIn("lee_learner");
  ada = await t.signIn("ada_author");
});
after(async () => {
  await t?.stop();
});

const campus = async (who: Record<string, string>): Promise<Campus> =>
  (await t.api(`/api/campus?tz=${encodeURIComponent(IST)}`, { headers: who })).json() as Promise<Campus>;
const finishClass = async (who: Record<string, string>, classKey: string, itemId: string): Promise<SavedAnswers> =>
  (
    await t.api(`/api/study-sets/${js}/answers`, {
      method: "POST",
      headers: who,
      body: JSON.stringify({ timeZone: IST, classKey, mode: "review", seq: 1, finished: true, answers: [{ kind: "flashcard", itemId, knew: true, ms: 5000 }] }),
    })
  ).json() as Promise<SavedAnswers>;

test("the campus is for signed-in players, with the browser's time zone", async () => {
  assert.equal((await t.api(`/api/campus?tz=${IST}`)).status, 401);
  const noZone = await t.api("/api/campus", { headers: lee });
  assert.equal(noZone.status, 400);
  assert.match(((await noZone.json()) as { error: string }).error, /^query\.tz: /);
  assert.equal((await t.api("/api/campus?tz=Mars/Olympus_Mons", { headers: lee })).status, 400);
});

test("the first visit makes the player: nothing studied yet, so no subjects and nothing on the timetable", async () => {
  const first = await campus(ada);
  assert.equal(first.day, dayKey(new Date(), IST));
  assert.deepEqual(
    { xp: first.player.xp, level: first.player.level, streak: first.player.streak, timeZone: first.player.settings.timeZone, toured: first.player.coach.toured },
    { xp: 0, level: 1, streak: { count: 0, freezes: 0 }, timeZone: IST, toured: false },
  );
  assert.deepEqual([first.subjects, first.timetable, first.today], [[], [], { xp: 0, answers: 0 }]);
  assert.ok(await Player.exists({ _id: ids.author }));
});

test("after a class, the campus shows the subject, today's timetable, XP and streak", async () => {
  await finishClass(lee, "review:round-1:a", String(ids.constCard));
  const now = await campus(lee);
  assert.deepEqual({ xp: now.player.xp, level: now.player.level, streak: now.player.streak.count }, { xp: 6, level: 1, streak: 1 });
  assert.deepEqual(
    now.subjects.map(({ category, plot, started, missed, status }) => ({ category, plot, started, missed, status })),
    [{ category: "Programming", plot: 0, started: 1, missed: 0, status: "warm" }],
  );
  // The set is 1 of 2 flashcards in, and nothing more pressing: carry on with it.
  assert.deepEqual(now.timetable, [
    {
      kind: "class",
      setId: js,
      mode: "review",
      why: { kind: "continue", n: 1, of: 2 },
      done: false,
      set: { topic: "JavaScript", subtopic: "Fundamentals", category: "Programming" },
    },
  ]);
  assert.deepEqual(now.today, { xp: 6, answers: 1 });
});

test("finishing the timetable's class ticks it off, and finishing the whole timetable gives its bonus, once", async () => {
  const done = await finishClass(lee, "review:round-1:b", String(ids.loopCard));
  assert.deepEqual(done.finished, { streak: 1, firstToday: false, timetableDone: true });
  assert.equal(done.xp, 6 + 50);
  const now = await campus(lee);
  assert.equal(now.timetable[0]?.done, true);
  assert.deepEqual(now.today, { xp: 6 + 56, answers: 2 });
  assert.equal(now.player.xp, 62);

  const again = await finishClass(lee, "review:round-1:c", String(ids.loopCard));
  assert.deepEqual(again.finished, { streak: 1, firstToday: false, timetableDone: false });
  assert.equal(again.xp, 6, "no second bonus");
});

test("a player made from the old app's copied progress gets its subjects, and a timetable from them", async () => {
  await Users.create({ username: "copied_learner", email: "copied@example.test", name: "Copied Learner", password: PASSWORD });
  const copied = await t.signIn("copied_learner");
  const userId = (await Users.findOne({ username: "copied_learner" }).lean<{ _id: unknown }>())?._id;
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await Progress.create({
    userId,
    setId: ids.bio,
    setInfo: { category: "Biology", topic: "Cells", subtopic: "Basics", flashcards: 1, questions: 0 },
    flashcards: { [String(ids.cellCard)]: { seenAt: fiveDaysAgo, missedOn: null } },
    lastAt: fiveDaysAgo,
    copiedAt: new Date(),
  });

  const first = await campus(copied);
  assert.deepEqual(
    first.subjects.map(({ category, plot, started, mastery, status }) => ({ category, plot, started, mastery, status })),
    [{ category: "Biology", plot: 0, started: 1, mastery: 1, status: "cold" }],
  );
  assert.deepEqual(
    first.timetable.map(({ setId, mode, why }) => ({ setId, mode, why })),
    [{ setId: String(ids.bio), mode: "review", why: { kind: "cold", n: 5 } }],
    "a set gone quiet for 5 days climbs back",
  );
});
