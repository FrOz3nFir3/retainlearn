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
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, ["0001-indexes"]);
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, []);

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
  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, ["0001-indexes"]);
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

  assert.deepEqual((await runMigrations(db, { log: quiet })).ran, ["0001-indexes"]);
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

test("every numbered file in src/migrations is in the list, in order", async () => {
  const files = (await readdir(new URL("../src/migrations/", import.meta.url))).filter((file) => /^\d{4}-.+\.js$/.test(file)).sort();
  assert.deepEqual(migrations.map((migration) => `${migration.id}.js`), files);
  assert.ok(migrations.every((migration) => migration.description && typeof migration.up === "function"));
});
