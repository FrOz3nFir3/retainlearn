// The subjects (P2-20): every subject with its counts, a page at a time with search, and one subject's study sets,
// for everyone; and a subject put on your campus before you study it, or taken off again while you haven't.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import type { AddedSubject, Campus, Subject, SubjectsPage } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import Cards from "../src/models/cards/cards.mongo.js";
import Player from "#models/players/players.mongo.ts";

const IST = "Asia/Kolkata";
const tz = `tz=${encodeURIComponent(IST)}`;

let t: Awaited<ReturnType<typeof startApi>>;
let lee: Record<string, string>;
before(async () => {
  t = await startApi();
  lee = await t.signIn("lee_learner");
  // Biology was updated last, so it comes first. Two sets nobody sees yet (a new account's): one in Biology, which
  // its counts leave out, and one in a subject of its own, which isn't listed at all.
  await Cards.collection.updateOne({ _id: ids.js }, { $set: { updatedAt: new Date("2026-02-01") } });
  await Cards.collection.updateOne({ _id: ids.bio }, { $set: { updatedAt: new Date("2026-03-01") } });
  const unlisted = { author: ids.author, review: [{ _id: new mongoose.Types.ObjectId(), question: "q", answer: "a" }], quizzes: [], listed: false, listAt: new Date("2099-01-01") };
  await Cards.collection.insertMany([
    { ...unlisted, "main-topic": "Genes", "sub-topic": "Not yet", category: "Biology", updatedAt: new Date("2026-04-01") },
    { ...unlisted, "main-topic": "Spam", "sub-topic": "Not yet", category: "Secret Stuff", updatedAt: new Date("2026-04-01") },
  ]);
});
after(async () => {
  await t?.stop();
});

const json = async <T>(path: string, init?: RequestInit): Promise<T> => (await t.api(path, init)).json() as Promise<T>;
const campus = () => json<Campus>(`/api/campus?${tz}`, { headers: lee });
const add = (name: string) => t.api(`/api/campus/subjects?${tz}`, { method: "POST", headers: lee, body: JSON.stringify({ name }) });
const remove = (name: string) => t.api(`/api/campus/subjects/${encodeURIComponent(name)}`, { method: "DELETE", headers: lee });

test("the subjects come with their listed sets' counts, the most recently updated first, for everyone", async () => {
  assert.deepEqual(await json<SubjectsPage>("/api/subjects"), {
    subjects: [
      { name: "Biology", sets: 1, flashcards: 1, questions: 0, updatedAt: "2026-03-01T00:00:00.000Z" },
      { name: "Programming", sets: 1, flashcards: 2, questions: 1, updatedAt: "2026-02-01T00:00:00.000Z" },
    ],
    total: 2,
    page: 1,
    pages: 1,
  });
});

test("search finds a word in a subject's name by its start, in any case; a page past the last is empty", async () => {
  const names = async (query: string) => (await json<SubjectsPage>(`/api/subjects?${query}`)).subjects.map((s) => s.name);
  assert.deepEqual(await names("search=PROG"), ["Programming"]);
  assert.deepEqual(await names("search=gram"), [], "not the middle of a word");
  assert.deepEqual(await names("search=secret"), [], "a subject with no listed set isn't one yet");
  assert.deepEqual(await names("search=.*"), [], "what's typed is matched as text");
  assert.deepEqual(await json<SubjectsPage>("/api/subjects?page=2"), { subjects: [], total: 2, page: 2, pages: 1 });
  assert.equal((await t.api("/api/subjects?page=0")).status, 400);
  assert.equal((await t.api("/api/subjects?page=two")).status, 400);
});

test("a subject's page has its listed sets in the order they were added, under the name as it's kept", async () => {
  assert.deepEqual(await json<Subject>("/api/subjects/programming"), {
    name: "Programming",
    sets: [{ _id: String(ids.js), topic: "JavaScript", subtopic: "Fundamentals", flashcards: 2, questions: 1 }],
  });
  assert.deepEqual((await json<Subject>("/api/subjects/Biology")).sets.map((s) => s.topic), ["Cells"], "not the unlisted set");
  assert.deepEqual(await json<Subject>("/api/subjects/Ancient%20History"), { name: "Ancient History", sets: [] }, "none yet");
  assert.equal((await t.api("/api/subjects/C%23")).status, 400, "a name that would break its link");
  assert.equal((await t.api(`/api/subjects/${"x".repeat(41)}`)).status, 400);
});

test("putting a subject on your campus is for signed-in players, with a name that fits", async () => {
  assert.equal((await t.api(`/api/campus/subjects?${tz}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"name":"Spanish"}' })).status, 401);
  assert.equal((await t.api("/api/campus/subjects", { method: "POST", headers: lee, body: '{"name":"Spanish"}' })).status, 400, "no time zone");
  assert.equal((await add("   ")).status, 400);
  assert.equal((await add("Maths/Physics")).status, 400);
});

test("a subject put on your campus takes the first free plot, not started; again, it's there already", async () => {
  const res = await add("  ancient   HISTORY ");
  assert.equal(res.status, 201);
  assert.deepEqual((await res.json()) as AddedSubject, { name: "Ancient History" });
  const subject = (await campus()).subjects.find((s) => s.category === "Ancient History");
  assert.deepEqual(subject, { category: "Ancient History", plot: 0, started: 0, mastery: 0, missed: 0, lastAt: null, status: "new", sets: 0 });
  assert.equal((await add("Ancient History")).status, 200);
  assert.equal((await campus()).subjects.length, 1);
});

test("a subject you haven't started can be taken off, and its plot is free again; one you've started stays", async () => {
  assert.equal((await add("Biology")).status, 201);
  assert.equal((await remove("Ancient History")).status, 204);
  assert.equal((await remove("Ancient History")).status, 204, "already gone");
  assert.equal((await add("Spanish")).status, 201);
  const plots = Object.fromEntries((await campus()).subjects.map((s) => [s.category, s.plot]));
  assert.deepEqual(plots, { Biology: 1, Spanish: 0 }, "Spanish takes the plot Ancient History left");

  await Player.updateOne({ _id: ids.learner, "subjects.category": "Biology" }, { $set: { "subjects.$.started": 1 } });
  assert.equal((await remove("Biology")).status, 409);
  assert.ok((await campus()).subjects.some((s) => s.category === "Biology"));
});

test("a campus holds at most 100 subjects put on it by hand", async () => {
  const subjects = Array.from({ length: 100 }, (_, plot) => ({ category: `Subject ${plot}`, plot, started: 0, mastery: 0, missed: 0 }));
  await Player.updateOne({ _id: ids.learner }, { $set: { subjects } });
  assert.equal((await add("One More")).status, 409);
  assert.equal((await add("Subject 7")).status, 200, "one that's there already is fine");
});

test("a new study set's topics and subject are checked, and it's listed in its subject straight away", async () => {
  const ada = await t.signIn("ada_author");
  const create = (body: Record<string, string>) => t.api("/api/cards", { method: "POST", headers: ada, body: JSON.stringify(body) });
  assert.equal((await create({ mainTopic: "x".repeat(61), subTopic: "Basics", category: "Spanish" })).status, 400);
  assert.equal((await create({ mainTopic: "Verbs", subTopic: " ", category: "Spanish" })).status, 400);
  assert.equal((await create({ mainTopic: "Verbs", subTopic: "Basics", category: "Spanish/French" })).status, 400);
  const res = await create({ mainTopic: "Verbs", subTopic: "Present tense", category: "spanish" });
  assert.equal(res.status, 200);
  const { _id } = (await res.json()) as { _id: string };
  assert.deepEqual((await json<Subject>("/api/subjects/Spanish")).sets, [{ _id, topic: "Verbs", subtopic: "Present tense", flashcards: 0, questions: 0 }]);
});

test("each subject on the campus says how many listed sets it has: the size of its building in 3D", async () => {
  const ada = await t.signIn("ada_author");
  const added = await t.api(`/api/campus/subjects?${tz}`, { method: "POST", headers: ada, body: JSON.stringify({ name: "Programming" }) });
  assert.ok([200, 201].includes(added.status));
  const subjects = (await json<Campus>(`/api/campus?${tz}`, { headers: ada })).subjects;
  assert.equal(subjects.find((s) => s.category === "Programming")?.sets, 1);
});
