// Paths (P2-07, TRACKER step 4, the 14 decisions of 2026-11-27): made and opened, listed and searched, edited by their
// editors against the version they opened, suggested to (one open each, accepted into the path as it is now, or
// declined), followed (its subject put on your campus), tested out of step by step, their skill claimed, deleted,
// copied and reported; and a new account's limits, as for study sets (P0-14).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import type { Campus, NewPath, PathHistoryPage, PathPerson, PathSkill, PathSuggestion, PathView, PathsPage, TestOutResult } from "@retainlearn/core";
import { startApi } from "./helpers.js";
import { ids, PASSWORD } from "./fixtures.js";
import Cards from "../src/models/cards/cards.mongo.js";
import Users from "../src/models/users/users.mongo.js";
import PathHistory from "#models/pathHistory/pathHistory.mongo.ts";

const { ObjectId } = mongoose.Types;
const tz = `tz=${encodeURIComponent("Asia/Kolkata")}`;

// A bigger set in Programming (12 flashcards, a question linked to each), and one a new account made, not yet listed.
const big = new ObjectId();
const hidden = new ObjectId();
const bigFlashcards = Array.from({ length: 12 }, () => new ObjectId());
const bigQuestions = Array.from({ length: 12 }, () => new ObjectId());
const setOf = (_id: InstanceType<typeof ObjectId>, title: string, more: object = {}) => ({
  _id,
  "main-topic": "JavaScript",
  "sub-topic": title,
  category: "Programming",
  author: ids.author,
  reviewers: [ids.author],
  review: bigFlashcards.map((f) => ({ _id: f, question: "<p>Q</p>", answer: "<p>A</p>" })),
  quizzes: bigQuestions.map((q, i) => ({ _id: q, quizQuestion: "<p>Q?</p>", quizAnswer: "Yes", options: [{ value: "No" }], flashcardId: bigFlashcards[i] })),
  ...more,
});

let t: Awaited<ReturnType<typeof startApi>>;
let ada: Record<string, string>;
let lee: Record<string, string>;
let nina: Record<string, string>; // a new account
let omar: Record<string, string>;
let jsQuestion: string;
before(async () => {
  t = await startApi();
  await Cards.collection.insertMany([setOf(big, "Closures and more"), setOf(hidden, "Not listed yet", { listed: false, listAt: new Date("2099-01-01") })]);
  jsQuestion = String((await Cards.collection.findOne({ _id: ids.js }))?.quizzes[0]._id);
  await Users.create([
    { name: "Nina New", username: "nina_new", email: "nina@example.test", password: PASSWORD },
    { name: "Omar Other", username: "omar_other", email: "omar@example.test", password: PASSWORD },
  ]);
  ada = await t.signIn("ada_author");
  lee = await t.signIn("lee_learner");
  nina = await t.signIn("nina_new");
  omar = await t.signIn("omar_other");
});
after(async () => {
  await t?.stop();
});

const send = (method: string, path: string, who: Record<string, string> | null, body?: unknown) =>
  t.api(path, { method, headers: who ?? { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const read = async <T>(res: Response, status = 200): Promise<T> => {
  assert.equal(res.status, status, `${res.status}: ${await res.clone().text()}`);
  return (await res.json()) as T;
};
const whole = (id: string, setId: InstanceType<typeof ObjectId>) => ({ id, setId: String(setId), flashcardIds: null, title: "" });
const content = (steps: unknown[], more: object = {}) => ({ title: "JavaScript fundamentals", category: "Programming", description: "From the basics up", visibility: "public", exam: true, steps, ...more });
const make = async (who: Record<string, string>, steps: unknown[], more: object = {}) => (await read<NewPath>(await send("POST", "/api/paths", who, content(steps, more)), 201))._id;
const open = (id: string, who: Record<string, string> | null = null) => send("GET", `/api/paths/${id}`, who);
const view = async (id: string, who: Record<string, string> | null = null) => read<PathView>(await open(id, who));
const names = (people: (PathPerson | null)[]) => people.map((p) => p?.username);

test("a path is made by someone signed in, and opens for everyone, each step with its set", async () => {
  assert.equal((await send("POST", "/api/paths", null, content([whole("s1", ids.js)]))).status, 401);
  const id = await make(ada, [whole("s1", ids.js), { id: "s2", setId: String(big), flashcardIds: [String(bigFlashcards[0]), String(bigFlashcards[1])], title: " Two closures " }]);
  const path = await view(id);
  assert.equal(path.title, "JavaScript fundamentals");
  assert.deepEqual(
    path.steps.map((s) => [s.id, s.set?.title, s.check, s.title]),
    [
      ["s1", "Fundamentals", "ok", ""],
      ["s2", "Closures and more", "ok", "Two closures"],
    ],
  );
  assert.equal(path.author?.username, "ada_author");
  assert.equal(path.you, null);
  assert.equal(path.listed, true);
  assert.ok(Date.parse(path.version));
  const mine = await view(id, ada);
  assert.equal(mine.you?.canEdit, true);
  assert.equal(mine.you?.isAuthor, true);
});

test("steps are checked: their sets in the path's subject, with something in them, and a public path's listed", async () => {
  const problem = async (steps: unknown[], more: object = {}) => (await read<{ error: string }>(await send("POST", "/api/paths", ada, content(steps, more)), 400)).error;
  assert.match(await problem([whole("s1", ids.bio)]), /in Biology, not Programming/);
  assert.match(await problem([whole("s1", hidden)]), /isn't listed yet, so it can only go in a private path/);
  assert.match(await problem([{ id: "s1", setId: String(big), flashcardIds: [String(new ObjectId())], title: "" }]), /none of its picked flashcards/);
  assert.match(await problem([whole("s1", new ObjectId())]), /no longer exists/);
  assert.equal((await send("POST", "/api/paths", ada, content([whole("s1", hidden)], { visibility: "private" }))).status, 201);
  assert.equal((await send("POST", "/api/paths", ada, content([whole("s1", ids.js), whole("s1", big)]))).status, 400);
});

test("the lists: listed public paths, a subject's, by a word in the title; the ones you can edit with mine=1", async () => {
  const shown = await make(ada, [whole("s1", big)], { title: "Closures deep dive" });
  const secret = await make(ada, [whole("s1", big)], { title: "Closures, my notes", visibility: "private" });
  const titles = async (query: string, who: Record<string, string> | null = null) => (await read<PathsPage>(await send("GET", `/api/paths?${query}`, who))).paths.map((p) => p.title);
  assert.ok((await titles("subject=Programming")).includes("Closures deep dive"));
  assert.ok(!(await titles("subject=Programming")).includes("Closures, my notes"));
  assert.deepEqual(await titles("search=deep"), ["Closures deep dive"]);
  assert.deepEqual(await titles("subject=Biology"), []);
  const mine = await titles("mine=1", ada);
  assert.ok(mine.includes("Closures, my notes") && mine.includes("Closures deep dive"));
  assert.equal((await send("GET", "/api/paths?mine=1", null)).status, 401);
  assert.equal((await open(secret)).status, 404);
  assert.equal((await open(secret, lee)).status, 404);
  assert.equal((await open(secret, ada)).status, 200);
  assert.equal((await open(shown, lee)).status, 200);
});

test("editing: its editors only, against the version they opened; who sees it is the author's call; history says who", async () => {
  const id = await make(ada, [whole("s1", ids.js)]);
  const first = await view(id, ada);
  const edit = (who: Record<string, string>, path: object, version = first.version) => send("PUT", `/api/paths/${id}`, who, { path, version });
  assert.equal((await edit(lee, content([whole("s1", ids.js)], { title: "Mine now" }))).status, 403);
  const editors = await read<{ editors: PathPerson[] }>(await send("POST", `/api/paths/${id}/editors`, ada, { username: "lee_learner" }));
  assert.deepEqual(names(editors.editors), ["lee_learner"]);
  assert.equal((await send("POST", `/api/paths/${id}/editors`, ada, { username: "nobody_here" })).status, 404);
  const edited = await read<PathView>(await edit(lee, content([whole("s1", ids.js), whole("s2", big)], { title: "JS, step by step" })));
  assert.equal(edited.title, "JS, step by step");
  assert.equal(edited.steps.length, 2);
  assert.notEqual(edited.version, first.version);
  assert.equal((await edit(lee, content([whole("s1", ids.js)], { title: "Too late" }))).status, 409);
  assert.equal((await edit(lee, content([whole("s1", ids.js)], { visibility: "private" }), edited.version)).status, 403);
  assert.equal((await send("DELETE", `/api/paths/${id}/editors/${ids.author}`, lee)).status, 400);
  const history = await read<PathHistoryPage>(await send("GET", `/api/paths/${id}/history`, null));
  assert.deepEqual(
    history.entries.map((e) => [e.kind, e.by?.username]),
    [
      ["edited", "lee_learner"],
      ["created", "ada_author"],
    ],
  );
  assert.deepEqual(history.entries[0]?.summary, ['Renamed to "JS, step by step"', "Added step: Closures and more (whole set, 12 flashcards)"]);
  assert.deepEqual(names((await read<{ editors: PathPerson[] }>(await send("DELETE", `/api/paths/${id}/editors/${ids.learner}`, ada))).editors), []);
});

test("suggestions: one open each; accepting applies its own changes to the path as it is now; the suggester sees the outcome", async () => {
  const id = await make(ada, [whole("s1", ids.js)]);
  const opened = await view(id, nina);
  const suggest = (who: Record<string, string>, path: object, version = opened.version) => send("PUT", `/api/paths/${id}/suggestions/mine`, who, { path, version });
  assert.equal((await suggest(ada, content([whole("s1", ids.js)], { title: "x" }))).status, 409);
  assert.equal((await suggest(nina, content([whole("s1", ids.js)]))).status, 400);
  await read<PathSuggestion>(await suggest(nina, content([whole("s1", ids.js)], { description: "First go" })));
  // Sending another replaces it, and who can see the path isn't the suggestion's to change.
  const mine = await read<PathSuggestion>(await suggest(nina, content([whole("s1", ids.js), whole("s2", big)], { visibility: "private" })));
  assert.deepEqual(mine.summary, ["Added step: Closures and more (whole set, 12 flashcards)"]);
  assert.equal(mine.after.visibility, "public");
  const open = await read<{ suggestions: PathSuggestion[] }>(await send("GET", `/api/paths/${id}/suggestions`, ada));
  assert.equal(open.suggestions.length, 1);
  assert.equal(open.suggestions[0]?.by?.username, "nina_new");
  // Ada edits meanwhile; the suggestion is now out of date, and accepting it keeps her edit.
  await read<PathView>(await send("PUT", `/api/paths/${id}`, ada, { path: content([whole("s1", ids.js)], { title: "JS, edited meanwhile" }), version: opened.version }));
  assert.equal((await view(id, nina)).you?.suggestion?.stale, true);
  const accepted = await read<PathView>(await send("POST", `/api/paths/${id}/suggestions/${mine._id}/accept`, ada));
  assert.equal(accepted.title, "JS, edited meanwhile");
  assert.deepEqual(
    accepted.steps.map((s) => s.id),
    ["s1", "s2"],
  );
  assert.equal((await send("POST", `/api/paths/${id}/suggestions/${mine._id}/accept`, ada)).status, 409);
  assert.equal((await view(id, nina)).you?.suggestion?.status, "accepted");
  const history = await read<PathHistoryPage>(await send("GET", `/api/paths/${id}/history`, null));
  assert.deepEqual([history.entries[0]?.kind, history.entries[0]?.by?.username, history.entries[0]?.from?.username], ["suggestion", "ada_author", "nina_new"]);
  // Declined, with a note the suggester sees.
  const next = await read<PathSuggestion>(await suggest(nina, content([whole("s2", big)], { title: "JS, edited meanwhile" }), accepted.version));
  assert.equal((await send("POST", `/api/paths/${id}/suggestions/${next._id}/decline`, lee, { note: "No" })).status, 403);
  assert.equal((await send("POST", `/api/paths/${id}/suggestions/${next._id}/decline`, ada, { note: "Keep the basics first." })).status, 204);
  const declined = (await view(id, nina)).you?.suggestion;
  assert.deepEqual([declined?.status, declined?.note], ["declined", "Keep the basics first."]);
  // Withdrawn.
  await read<PathSuggestion>(await suggest(nina, content([whole("s1", ids.js)], { title: "JS, edited meanwhile", description: "Again" }), accepted.version));
  assert.equal((await send("DELETE", `/api/paths/${id}/suggestions/mine`, nina)).status, 204);
  assert.deepEqual((await read<{ suggestions: PathSuggestion[] }>(await send("GET", `/api/paths/${id}/suggestions`, ada))).suggestions, []);
});

test("following a path puts its subject on your campus; one path at a time", async () => {
  const id = await make(ada, [whole("s1", ids.bio)], { category: "Biology", title: "Cells first" });
  assert.deepEqual(await read(await send("PUT", `/api/paths/${id}/follow?${tz}`, lee)), { following: true });
  const campus = await read<Campus>(await send("GET", `/api/campus?${tz}`, lee));
  assert.ok(campus.subjects.some((s) => s.category === "Biology"));
  assert.equal((await view(id, lee)).you?.following, true);
  assert.equal((await send("DELETE", `/api/paths/${id}/follow`, lee)).status, 204);
  assert.equal((await view(id, lee)).you?.following, false);
});

test("testing out of a step: as many of its questions as it asks, each once, 80% of them right", async () => {
  const id = await make(ada, [whole("s1", big), { id: "s2", setId: String(big), flashcardIds: bigFlashcards.slice(0, 3).map(String), title: "" }]);
  const answers = (questions: InstanceType<typeof ObjectId>[], right: number) => ({ answers: questions.map((q, i) => ({ questionId: String(q), right: i < right })) });
  const testOut = (stepId: string, body: object) => send("POST", `/api/paths/${id}/steps/${stepId}/test-out?${tz}`, lee, body);
  assert.deepEqual(await read<TestOutResult>(await testOut("s1", answers(bigQuestions.slice(0, 10), 7))), { passed: false });
  assert.equal((await testOut("s1", answers(bigQuestions.slice(0, 9), 9))).status, 400);
  assert.equal((await testOut("s1", answers([...bigQuestions.slice(0, 9), new ObjectId()], 10))).status, 400);
  assert.equal((await testOut("s2", answers(bigQuestions.slice(3, 6), 3))).status, 400);
  assert.equal((await testOut("nope", answers(bigQuestions.slice(0, 1), 1))).status, 404);
  assert.deepEqual((await view(id, lee)).you?.testedOut, []);
  assert.deepEqual(await read<TestOutResult>(await testOut("s1", answers(bigQuestions.slice(2, 12), 8))), { passed: true });
  assert.deepEqual(await read<TestOutResult>(await testOut("s2", answers(bigQuestions.slice(0, 3), 3))), { passed: true });
  assert.deepEqual((await view(id, lee)).you?.testedOut, ["s1", "s2"]);
});

test("a path's skill: only once every step is done, kept for good with the title it had", async () => {
  const id = await make(ada, [whole("s1", ids.js), whole("s2", big)], { title: "Skill path" });
  const claim = () => send("POST", `/api/paths/${id}/skill?${tz}`, lee);
  assert.match((await read<{ error: string }>(await claim(), 409)).error, /0 of 2 done/);
  const testOut = (stepId: string, questions: string[]) => send("POST", `/api/paths/${id}/steps/${stepId}/test-out?${tz}`, lee, { answers: questions.map((questionId) => ({ questionId, right: true })) });
  await read<TestOutResult>(await testOut("s1", [jsQuestion]));
  assert.match((await read<{ error: string }>(await claim(), 409)).error, /1 of 2 done/);
  await read<TestOutResult>(await testOut("s2", bigQuestions.slice(0, 10).map(String)));
  const skill = await read<PathSkill>(await claim());
  assert.equal(skill.title, "Skill path");
  const renamed = await view(id, ada);
  await read<PathView>(await send("PUT", `/api/paths/${id}`, ada, { path: content([whole("s1", ids.js), whole("s2", big)], { title: "Renamed later" }), version: renamed.version }));
  const again = await read<PathSkill>(await claim());
  assert.deepEqual([again.title, again.at], ["Skill path", skill.at]);
  assert.equal((await view(id, lee)).you?.skill?.at, skill.at);
});

test("deleting: its author only; then it's gone for everyone, its history kept", async () => {
  const id = await make(ada, [whole("s1", ids.js)]);
  await send("POST", `/api/paths/${id}/editors`, ada, { username: "lee_learner" });
  assert.equal((await send("DELETE", `/api/paths/${id}`, lee)).status, 403);
  assert.equal((await send("DELETE", `/api/paths/${id}`, ada)).status, 204);
  assert.equal((await open(id, ada)).status, 404);
  assert.equal((await send("GET", `/api/paths/${id}/history`, null)).status, 404);
  assert.deepEqual(
    (await PathHistory.find({ pathId: new ObjectId(id) }).sort({ at: -1 }).lean()).map((e) => e.kind),
    ["deleted", "created"],
  );
});

test("a copy is private and yours, titled (copy), its steps kept", async () => {
  const id = await make(omar, [whole("s1", ids.js), whole("s2", big)], { title: "Original path" });
  const copy = (await read<NewPath>(await send("POST", `/api/paths/${id}/copy`, lee), 201))._id;
  const copied = await view(copy, lee);
  assert.deepEqual([copied.title, copied.visibility, copied.author?.username, copied.copiedFrom, copied.you?.isAuthor], ["Original path (copy)", "private", "lee_learner", id, true]);
  assert.deepEqual(
    copied.steps.map((s) => s.id),
    ["s1", "s2"],
  );
  assert.equal((await open(copy, omar)).status, 404);
});

test("a new account: its public paths wait to be listed, and it makes fewer a day", async () => {
  const first = await make(nina, [whole("s1", ids.js)], { title: "Nina's first path" });
  const listed = await read<PathsPage>(await send("GET", "/api/paths?search=nina", null));
  assert.deepEqual(listed.paths, []);
  const opened = await view(first);
  assert.equal(opened.listed, false);
  await make(nina, [whole("s1", ids.js)], { title: "Two" });
  await make(nina, [whole("s1", ids.js)], { title: "Three" });
  assert.equal((await send("POST", "/api/paths", nina, content([whole("s1", ids.js)], { title: "Four" }))).status, 429);
});

test("reports: one per person, never your own; enough people take a path out of the lists", async () => {
  // Lee's: Ada has made her day's paths by now (the cap at work).
  const id = await make(lee, [whole("s1", ids.js)], { title: "Reported path" });
  const inList = async () => (await read<PathsPage>(await send("GET", "/api/paths?search=reported", null))).paths.length;
  assert.equal(await inList(), 1);
  const report = (who: Record<string, string>) => send("POST", `/api/paths/${id}/report`, who, { reason: "spam" });
  assert.equal((await report(lee)).status, 400);
  await read(await report(ada));
  await read(await report(ada));
  await read(await report(nina));
  assert.equal(await inList(), 1);
  await read(await report(omar));
  assert.equal(await inList(), 0);
  assert.equal((await open(id)).status, 200);
});
