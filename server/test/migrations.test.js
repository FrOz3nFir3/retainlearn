// Database migrations (P1-01). Each runs once, in order, and is recorded; a dry run writes nothing; one that fails
// isn't recorded and holds back the ones after it; one server at a time runs them. And the real ones: on an empty
// database they make every index the models declare, they keep the indexes Mongoose made before them, and they
// won't make a value unique while two accounts share it.
import "./setup-env.js"; // first: the app reads its settings when it's imported
import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import mongoose from "mongoose";
import { initMongoDB, mongoDisconnect } from "../src/services/mongo.js";
import { assertLocalRetainlearn } from "../scripts/local-only.js";
import { migrationStatus, runAtStartup, runMigrations, shouldRunMigrations } from "../src/migrations/runner.js";
import migrations from "../src/migrations/index.js";
import Users from "../src/models/users/users.mongo.js";
import Cards from "../src/models/cards/cards.mongo.js";
import StudySetReport from "../src/models/studySetReports/studySetReports.mongo.js";

let db;
before(async () => {
  // Each test drops this database, so it must be the local test one, whatever the environment says.
  assertLocalRetainlearn(process.env.MONGO_URI, { exact: "retainlearn_test" });
  await initMongoDB();
  db = mongoose.connection.db;
});
beforeEach(() => db.dropDatabase());
after(() => mongoDisconnect());

const quiet = () => {};
const everyId = migrations.map((migration) => migration.id);
const recorded = async () => (await db.collection("migrations").find().sort({ _id: 1 }).toArray()).map((m) => m._id);
const locks = () => db.collection("migrations_lock").countDocuments();
// A made-up migration that notes each time it runs.
const step = (id, calls = []) => ({ id, description: `step ${id}`, up: async () => void calls.push(id) });

test("new migrations run in order, once each, and each is recorded", async () => {
  const calls = [];
  const first = [step("0001-a", calls), step("0002-b", calls)];
  assert.deepEqual((await runMigrations(db, { list: first, log: quiet })).ran, ["0001-a", "0002-b"]);
  const later = [...first, step("0003-c", calls)];
  assert.deepEqual((await runMigrations(db, { list: later, log: quiet })).ran, ["0003-c"]);
  assert.deepEqual((await runMigrations(db, { list: later, log: quiet })).ran, []);
  assert.deepEqual(calls, ["0001-a", "0002-b", "0003-c"]);

  const records = await db.collection("migrations").find().sort({ _id: 1 }).toArray();
  assert.deepEqual(records.map((m) => m._id), ["0001-a", "0002-b", "0003-c"]);
  assert.ok(records.every((m) => m.description && m.ranAt instanceof Date && m.ms >= 0));
  assert.equal(await locks(), 0, "the lock is let go");
});

test("a dry run says what each would do and writes nothing, not even the lock", async () => {
  const adds = {
    id: "0001-adds",
    description: "adds a document",
    up: async (db, { dryRun, log }) => {
      if (dryRun) return log("would add one document");
      await db.collection("things").insertOne({ made: true });
    },
  };
  const lines = [];
  const result = await runMigrations(db, { list: [adds], dryRun: true, log: (text) => lines.push(text) });
  assert.deepEqual(result, { ran: [], pending: ["0001-adds"], problems: 0 });
  assert.deepEqual(lines, ["0001-adds will run: adds a document", "  would add one document"]);
  assert.deepEqual(await db.listCollections().toArray(), [], "no collection was made");
});

test("a migration that fails isn't recorded, the ones after it wait, and the next run starts again from it", async () => {
  const calls = [];
  let broken = true;
  const flaky = {
    id: "0002-flaky",
    description: "fails the first time",
    up: async () => {
      calls.push("0002-flaky");
      if (broken) throw new Error("the network dropped");
    },
  };
  const list = [step("0001-a", calls), flaky, step("0003-c", calls)];

  await assert.rejects(runMigrations(db, { list, log: quiet }), /^Error: 0002-flaky stopped: the network dropped$/);
  assert.deepEqual(await recorded(), ["0001-a"]);
  assert.equal(await locks(), 0, "the lock is let go");

  broken = false;
  assert.deepEqual((await runMigrations(db, { list, log: quiet })).ran, ["0002-flaky", "0003-c"]);
  assert.deepEqual(calls, ["0001-a", "0002-flaky", "0002-flaky", "0003-c"]);
});

test("one server at a time runs them, and a lock left by a server that stopped is taken over", async () => {
  // Two servers starting together: the migration runs once.
  let runs = 0;
  const slow = {
    id: "0001-slow",
    description: "takes a moment",
    up: async () => {
      runs++;
      await wait(100);
    },
  };
  const both = await Promise.all([runMigrations(db, { list: [slow], log: quiet }), runMigrations(db, { list: [slow], log: quiet })]);
  assert.equal(runs, 1);
  assert.deepEqual(both.flatMap((result) => result.ran), ["0001-slow"]);

  // Another server holds the lock: this one leaves the migrations to it.
  await db.collection("migrations_lock").insertOne({ _id: "lock", owner: "another server", renewedAt: new Date() });
  const blocked = await runMigrations(db, { list: [step("0002-b")], log: quiet });
  assert.equal(blocked.locked, true);
  assert.deepEqual(blocked.ran, []);

  // That server stopped part-way 11 minutes ago: its lock is taken over.
  await db.collection("migrations_lock").updateOne({ _id: "lock" }, { $set: { renewedAt: new Date(Date.now() - 11 * 60 * 1000) } });
  assert.deepEqual((await runMigrations(db, { list: [step("0002-b")], log: quiet })).ran, ["0002-b"]);
  assert.equal(await locks(), 0);
});

test("at startup, a migration that fails is logged and shown in /api/health, and the server carries on", async () => {
  const broken = {
    id: "0001-broken",
    description: "fails",
    up: async () => {
      throw new Error("no");
    },
  };
  const errors = mock.method(console, "error", () => {});
  try {
    await runAtStartup(db, { list: [broken], log: quiet });
    assert.equal(errors.mock.callCount(), 1);
  } finally {
    mock.restoreAll();
  }
  assert.deepEqual(migrationStatus(), { state: "failed" });

  await runAtStartup(db, { list: [step("0001-fixed")], log: quiet });
  assert.deepEqual(migrationStatus(), { state: "done", latest: "0001-fixed" });
});

test("the deployed server runs them; a development server only when its database is on this machine", () => {
  const remote = "mongodb://user:secret@db.example.net:27017/app";
  assert.equal(shouldRunMigrations({ nodeEnv: "production", uri: remote }), true);
  assert.equal(shouldRunMigrations({ nodeEnv: "development", uri: "mongodb://localhost:27017/retainlearn" }), true);
  assert.equal(shouldRunMigrations({ nodeEnv: "development", uri: "mongodb://127.0.0.1:27017/retainlearn" }), true);
  assert.equal(shouldRunMigrations({ nodeEnv: "development", uri: remote }), false);
  assert.equal(shouldRunMigrations({ nodeEnv: "development", uri: "mongodb+srv://cluster0.example.net/app" }), false);
  assert.equal(shouldRunMigrations({ nodeEnv: "development", uri: "" }), false);
});

test("on an empty database, the migrations make every index the models declare, and no others", async () => {
  // Every model, including any added later.
  const models = new URL("../src/models/", import.meta.url);
  for (const file of await readdir(models, { recursive: true })) {
    if (file.endsWith(".mongo.js")) await import(new URL(file, models));
  }
  assert.ok(mongoose.modelNames().length >= 3, mongoose.modelNames().join(", "));

  await runMigrations(db, { log: quiet });
  for (const name of mongoose.modelNames()) {
    const { toCreate, toDrop } = await mongoose.model(name).diffIndexes();
    assert.deepEqual({ toCreate, toDrop }, { toCreate: [], toDrop: [] }, `${name}: the indexes declared and made differ`);
  }
});

test("running them again changes nothing, and 0001 is safe to run again by itself", async () => {
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, everyId);
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, []);

  // 0001 again straight after itself (before 0002 renames card_reports), as when a failed run is tried again.
  await db.dropDatabase();
  await runMigrations(db, { list: [migrations[0]], log: quiet });
  const made = await db.collection("users").indexes();
  const lines = [];
  await migrations[0].up(db, { dryRun: false, log: (text) => lines.push(text), fail: (text) => assert.fail(text) });
  assert.equal(lines.length, 4);
  assert.ok(lines.every((line) => line.endsWith(": already there")), lines.join("\n"));
  assert.deepEqual(await db.collection("users").indexes(), made);
});

test("0001 keeps the indexes Mongoose made, and won't make emails unique while two accounts share one", async () => {
  const users = db.collection("users");
  await users.createIndex({ username: 1 }, { unique: true, background: true }); // as Mongoose made it
  await users.insertMany([
    { username: "one", email: "shared@example.test" },
    { username: "two", email: "shared@example.test" },
    { username: "three", email: "three@example.test", googleId: "google-3" },
  ]);

  const lines = [];
  const problems = [];
  const plan = await runMigrations(db, { dryRun: true, log: (text) => lines.push(text), problem: (text) => problems.push(text) });
  assert.equal(plan.problems, 1);
  assert.deepEqual(problems, ["0001-indexes: users email (unique): 1 value(s) belong to more than one document. Make them unique first."]);
  assert.match(lines.join("\n"), /users username \(unique\): already there/);
  assert.match(lines.join("\n"), /users googleId \(unique\): will be made/);
  assert.doesNotMatch([...lines, ...problems].join("\n"), /shared@example/, "no one's email is printed");
  const names = async () => (await users.indexes()).map((index) => index.name).sort();
  assert.deepEqual(await names(), ["_id_", "username_1"], "the dry run made no index");
  assert.deepEqual((await db.listCollections().toArray()).map((c) => c.name), ["users"], "nor any collection");

  await assert.rejects(runMigrations(db, { log: quiet }), /0001-indexes stopped: users email/);
  assert.deepEqual(await recorded(), []);

  // Once the email is sorted out, it runs. The two accounts without a Google id don't clash.
  await users.updateOne({ username: "two" }, { $set: { email: "two@example.test" } });
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, everyId);
  await assert.rejects(users.insertOne({ username: "four", email: "three@example.test" }), { code: 11000 });
  await assert.rejects(users.insertOne({ username: "five", email: "five@example.test", googleId: "google-3" }), { code: 11000 });
});

test("0001 leaves an index on the same fields with other options alone: that's sorted out by hand", async () => {
  await db.collection("users").createIndex({ email: 1 }); // not unique
  const problems = [];
  await runMigrations(db, { dryRun: true, log: quiet, problem: (text) => problems.push(text) });
  assert.deepEqual(problems, [
    '0001-indexes: users email (unique): the index "email_1" is on the same fields with other options (not unique). Drop it by hand first.',
  ]);
  await assert.rejects(runMigrations(db, { log: quiet }), /email_1/);
  const email = (await db.collection("users").indexes()).find((index) => index.name === "email_1");
  assert.ok(email && !email.unique, "left as it was");
});

test("0001 replaces an older googleId index with other options, as production has, once no two accounts share one", async () => {
  const users = db.collection("users");
  await users.createIndex({ googleId: 1 }, { unique: true, sparse: true }); // an older form
  await users.insertMany([
    { username: "one", email: "one@example.test", googleId: "google-1" },
    { username: "two", email: "two@example.test", googleId: "google-2" },
    { username: "three", email: "three@example.test" },
    { username: "four", email: "four@example.test" },
  ]);
  const googleIndex = async () => (await users.indexes()).find((index) => index.name === "googleId_1");

  const lines = [];
  const plan = await runMigrations(db, { dryRun: true, log: (text) => lines.push(text), problem: assert.fail });
  assert.equal(plan.problems, 0);
  assert.ok(
    lines.includes(
      '  users googleId (unique): will replace "googleId_1" (unique, sparse) with one that\'s unique, only where {"googleId":{"$exists":true}}; no value is shared',
    ),
    lines.join("\n"),
  );
  assert.equal((await googleIndex()).sparse, true, "the dry run left it as it was");

  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, everyId);
  const replaced = await googleIndex();
  assert.equal(replaced.sparse, undefined);
  assert.deepEqual(replaced.partialFilterExpression, { googleId: { $exists: true } });
  assert.deepEqual(await Users.diffIndexes(), { toDrop: [], toCreate: [] }, "now as the model declares");
  await assert.rejects(users.insertOne({ username: "five", email: "five@example.test", googleId: "google-1" }), { code: 11000 });
});

test("0001 keeps the old googleId index while two accounts share a Google id", async () => {
  const users = db.collection("users");
  await users.createIndex({ googleId: 1 }); // not unique
  await users.insertMany([
    { username: "one", email: "one@example.test", googleId: "google-1" },
    { username: "two", email: "two@example.test", googleId: "google-1" },
  ]);
  const problems = [];
  await runMigrations(db, { dryRun: true, log: quiet, problem: (text) => problems.push(text) });
  assert.deepEqual(problems, ["0001-indexes: users googleId (unique): 1 value(s) belong to more than one document. Make them unique first."]);

  await assert.rejects(runMigrations(db, { log: quiet }), /users googleId/);
  const kept = (await users.indexes()).find((index) => index.name === "googleId_1");
  assert.ok(kept && !kept.unique && !kept.partialFilterExpression, "not dropped");
  assert.deepEqual(await recorded(), []);
});

test("0002 renames cards and card_reports with their documents and indexes, and gives reports the new field names", async () => {
  const [setA, setB, lee, ada] = [1, 2, 3, 4].map(() => new mongoose.Types.ObjectId());
  await db.collection("cards").insertMany([{ _id: setA, "main-topic": "A" }, { _id: setB, "main-topic": "B" }]);
  // card_reports as Phase 0 left it: the old field names, and its unique index on them.
  const oldReports = db.collection("card_reports");
  await oldReports.createIndex({ card: 1, reporter: 1 }, { unique: true, background: true });
  await oldReports.insertMany([
    { card: setA, reporter: lee, reason: "spam", note: "", createdAt: new Date("2026-11-01") },
    { card: setA, reporter: ada, reason: "wrong", note: "typo", createdAt: new Date("2026-11-02") },
  ]);

  const lines = [];
  await runMigrations(db, { dryRun: true, log: (text) => lines.push(text), problem: assert.fail });
  for (const line of [
    "  cards → study_sets: will be renamed, with its 2 document(s) and its indexes",
    "  card_reports → study_set_reports: will be renamed, with its 2 document(s) and its indexes",
    '  study_set_reports: its index "card_1_reporter_1" on card + reporter will be dropped for one on setId + by',
    "  study_set_reports: 2 report(s) will get the new field names (setId, by, at)",
  ]) {
    assert.ok(lines.includes(line), `${line}\nnot in:\n${lines.join("\n")}`);
  }
  const names = async () => (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).sort();
  assert.deepEqual(await names(), ["card_reports", "cards"], "the dry run renamed nothing");

  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, everyId);
  assert.ok(!(await names()).some((name) => name === "cards" || name === "card_reports"));
  assert.equal(await Cards.countDocuments(), 2, "the study set model reads study_sets");
  const reports = await db.collection("study_set_reports").find({}, { projection: { _id: 0 } }).sort({ at: 1 }).toArray();
  assert.deepEqual(reports, [
    { setId: setA, by: lee, reason: "spam", note: "", at: new Date("2026-11-01") },
    { setId: setA, by: ada, reason: "wrong", note: "typo", at: new Date("2026-11-02") },
  ]);
  assert.deepEqual(await StudySetReport.diffIndexes(), { toDrop: [], toCreate: [] }, "only the index on setId + by");
  await assert.rejects(StudySetReport.create({ setId: setA, by: lee, reason: "other" }), { code: 11000 });
});

test("0002 won't merge cards into a study_sets that's already there: that's sorted out by hand", async () => {
  await db.collection("cards").insertOne({ "main-topic": "old" });
  await db.collection("study_sets").insertOne({ "main-topic": "new" });
  const problems = [];
  await runMigrations(db, { dryRun: true, log: quiet, problem: (text) => problems.push(text) });
  assert.deepEqual(problems, ["0002-study-set-names: cards → study_sets: both are here. Sort it out by hand first."]);
  await assert.rejects(runMigrations(db, { log: quiet }), /0002-study-set-names stopped: cards → study_sets/);
  assert.deepEqual(await recorded(), ["0001-indexes"], "0001 ran; 0002 waits");
  assert.equal(await db.collection("cards").countDocuments(), 1);
  assert.equal(await db.collection("study_sets").countDocuments(), 1);
});

test("0003 makes answers a time series and expires suggestions by themselves, and is safe to run again", async () => {
  await runMigrations(db, { log: quiet });
  const [answers] = await db.listCollections({ name: "answers" }).toArray();
  assert.equal(answers.type, "timeseries");
  assert.deepEqual(
    { timeField: answers.options.timeseries.timeField, metaField: answers.options.timeseries.metaField },
    { timeField: "at", metaField: "meta" },
  );
  const expiry = (await db.collection("study_set_suggestions").indexes()).find((index) => index.expireAfterSeconds !== undefined);
  assert.deepEqual({ key: expiry.key, seconds: expiry.expireAfterSeconds }, { key: { expiresAt: 1 }, seconds: 0 });

  const lines = [];
  await migrations[2].up(db, { dryRun: false, log: (text) => lines.push(text), fail: (text) => assert.fail(text) });
  assert.equal(lines.length, 6);
  assert.ok(lines.every((line) => line.endsWith(": already there")), lines.join("\n"));
});

test("0003 won't take over an ordinary collection called answers: that's sorted out by hand", async () => {
  await db.createCollection("answers");
  const problems = [];
  await runMigrations(db, { dryRun: true, log: quiet, problem: (text) => problems.push(text) });
  assert.deepEqual(problems, [
    '0003-new-collections: answers (time series on at, by meta): "answers" is already there as an ordinary collection. Sort it out by hand first.',
  ]);
  await assert.rejects(runMigrations(db, { log: quiet }), /0003-new-collections stopped: answers/);
  assert.deepEqual(await recorded(), ["0001-indexes", "0002-study-set-names"], "0001 and 0002 ran; 0003 waits");
});

// A study set with three flashcards and three questions, and an account with today's study history for it, plus an
// entry for a set deleted since, and a flashcard and a question deleted since. Stored as the old app stores them.
async function studied() {
  const newId = () => new mongoose.Types.ObjectId();
  const t = { lee: newId(), ada: newId(), set: newId(), goneSet: newId(), f: [newId(), newId(), newId()], q: [newId(), newId(), newId()] };
  await db.collection("study_sets").insertOne({
    _id: t.set,
    category: "Programming",
    "main-topic": "JavaScript",
    "sub-topic": "Basics",
    review: t.f.map((_id) => ({ _id, question: "<p>Q</p>", answer: "<p>A</p>" })),
    quizzes: t.q.map((_id) => ({ _id, quizQuestion: "<p>Q</p>", quizAnswer: "<p>A</p>", options: [] })),
    updatedAt: new Date("2026-11-01T00:00:00Z"),
  });
  await db.collection("users").insertMany([
    {
      _id: t.lee,
      username: "lee_learner",
      email: "lee@example.test",
      studying: [
        {
          cardId: t.set,
          review: {
            lastReviewedCardNo: 2,
            weakCards: [
              { flashcardId: t.f[1], addedAt: new Date("2026-11-09T23:30:00Z") },
              { flashcardId: t.f[2], addedAt: new Date("2026-11-10T08:00:00Z") },
              { flashcardId: newId(), addedAt: new Date("2026-11-10T08:00:00Z") }, // deleted from the set since
            ],
            updatedAt: new Date("2026-11-10T09:00:00Z"),
          },
          quiz: {
            timesStarted: 3,
            timesFinished: 2,
            attempts: [
              { quizId: t.q[0], timesCorrect: 2, timesIncorrect: 1, struggling: false },
              { quizId: t.q[1], timesCorrect: 1, timesIncorrect: 2, struggling: true },
              { quizId: t.q[2], timesCorrect: 0, timesIncorrect: 1, struggling: false },
              { quizId: newId(), timesCorrect: 1, timesIncorrect: 0, struggling: false }, // deleted from the set since
            ],
            updatedAt: new Date("2026-11-12T20:00:00Z"),
          },
        },
        { cardId: t.goneSet, review: { lastReviewedCardNo: 5, updatedAt: new Date("2026-10-01") }, quiz: {} },
      ],
    },
    { _id: t.ada, username: "ada_author", email: "ada@example.test", studying: [] },
  ]);
  return t;
}

test("0004 copies each account's study history into progress, for the sets that still exist, and leaves the old data as it is", async () => {
  const t = await studied();
  const lines = [];
  await runMigrations(db, { dryRun: true, log: (text) => lines.push(text), problem: assert.fail });
  for (const line of [
    "  progress: 1 document(s) will be made, from 1 account(s) with a study history",
    "  progress: 1 entr(y/ies) for study set(s) deleted since, left out",
    "  progress: 2 flashcard(s) or question(s) deleted from their sets since, left out",
  ]) {
    assert.ok(lines.includes(line), `${line}\nnot in:\n${lines.join("\n")}`);
  }
  assert.equal(await db.collection("progress").countDocuments(), 0, "the dry run made nothing");

  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, everyId);
  const docs = await db.collection("progress").find({}, { projection: { _id: 0 } }).toArray();
  assert.equal(docs.length, 1);
  const { copiedAt, createdAt, updatedAt, ...copied } = docs[0];
  assert.ok(copiedAt instanceof Date);
  assert.deepEqual([createdAt, updatedAt], [copiedAt, copiedAt]);
  const [f1, f2, f3] = t.f.map(String);
  const [q1, q2, q3] = t.q.map(String);
  assert.deepEqual(copied, {
    userId: t.lee,
    setId: t.set,
    setInfo: { category: "Programming", topic: "JavaScript", subtopic: "Basics", flashcards: 3, questions: 3, version: Date.parse("2026-11-01T00:00:00Z") },
    // The first 2 flashcards were reviewed (lastReviewedCardNo). The 2nd and 3rd were marked weak: missed on the
    // (UTC) day they were marked.
    flashcards: {
      [f1]: { seenAt: new Date("2026-11-10T09:00:00Z"), missedOn: null },
      [f2]: { seenAt: new Date("2026-11-10T09:00:00Z"), missedOn: "2026-11-09" },
      [f3]: { seenAt: new Date("2026-11-10T08:00:00Z"), missedOn: "2026-11-10" },
    },
    questions: {
      [q1]: { level: 1, refreshedAt: new Date("2026-11-12T20:00:00Z"), right: 2, wrong: 1, missedOn: null }, // a player card
      [q2]: { level: 0, right: 1, wrong: 2, missedOn: "2026-11-12" }, // marked struggling
      [q3]: { level: 0, right: 0, wrong: 1, missedOn: null }, // never got right
    },
    quiz: { started: 3, finished: 2 },
    lastAt: new Date("2026-11-12T20:00:00Z"),
  });

  const lee = await db.collection("users").findOne({ _id: t.lee });
  assert.equal(lee.studying.length, 2, "the old study history stays");
  assert.equal(lee.studying[0].quiz.attempts.length, 4);
});

test("0004 makes only missing documents: it never overwrites progress that's there, and running it again changes nothing", async () => {
  const t = await studied();
  await runMigrations(db, { log: quiet });
  // The new app saves to the copied document.
  await db.collection("progress").updateOne({ userId: t.lee, setId: t.set }, { $set: { [`questions.${t.q[2]}.right`]: 1, updatedAt: new Date() } });
  const saved = await db.collection("progress").findOne({ userId: t.lee, setId: t.set });

  const lines = [];
  await migrations[3].up(db, { dryRun: false, log: (text) => lines.push(text), fail: (text) => assert.fail(text) });
  assert.deepEqual(await db.collection("progress").findOne({ userId: t.lee, setId: t.set }), saved);
  assert.equal(await db.collection("progress").countDocuments(), 1);
  assert.ok(lines.includes("progress: 0 document(s) made, from 1 account(s) with a study history"), lines.join("\n"));
  assert.ok(lines.includes("progress: 1 already there, kept as they are"), lines.join("\n"));
});

test("0004 says so when there's no study history to copy", async () => {
  const lines = [];
  await runMigrations(db, { log: (text) => lines.push(text) });
  assert.ok(lines.includes("  progress: no study history to copy"), lines.join("\n"));
});

test("every numbered file in src/migrations is in the list, in order", async () => {
  const files = (await readdir(new URL("../src/migrations/", import.meta.url))).filter((file) => /^\d{4}-.+\.js$/.test(file)).sort();
  assert.deepEqual(migrations.map((migration) => `${migration.id}.js`), files);
  assert.ok(migrations.every((migration) => migration.description && typeof migration.up === "function"));
});
