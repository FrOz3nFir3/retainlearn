// Database migrations (P1-01): numbered changes to the database (indexes now; new collections and the data copied
// into them later), each run once, in order, and recorded in the `migrations` collection. The deployed server runs
// the new ones itself once it's answering requests (runAtStartup, from server.js), so a deploy needs nothing run by
// hand. `npm run check:data` shows, read-only, what they'll do to a database before deploying them.
//
// Adding one: a file `NNNN-what-it-does.js` that exports `id` (its file name), `description` and `up(db, ctx)`, at
// the end of the list in index.js. See 0001-indexes.js. The rules:
// 1. Code before data. The code that ships with a migration works whether it has run or not: the server is already
//    answering requests while it runs, and if it fails, the site carries on as before.
// 2. Safe to run again. A migration that fails isn't recorded, so the next start runs it again from the top.
// 3. The driver (`db.collection(...)`), not the Mongoose models. The models describe the documents as the code reads
//    them today; a migration has to keep working on the documents as they were when it was written.
// 4. With `ctx.dryRun` set, only read, and say what would change (`ctx.log`). Anything that would stop it goes to
//    `ctx.fail(text)`: a real run stops there, a dry run lists it and carries on.
// 5. Never changed once it's merged: a new migration changes things again.
// 6. Counts, never anyone's details (emails, names), in what it says.
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import env from "../config/env.js";
import migrations from "./index.js";

// The lock that lets one server at a time run them. A lock that hasn't been renewed for this long was left by a
// server that stopped part-way, and is taken over.
const LOCK_STALE_MS = 10 * 60 * 1000;
const LOCK_RENEW_MS = 60 * 1000;

async function takeLock(db) {
  const locks = db.collection("migrations_lock");
  const owner = `${hostname()} ${process.pid} ${randomUUID()}`;
  const now = new Date();
  try {
    // One step: with no lock, the upsert inserts one; a stale lock matches the filter and becomes this server's; a
    // live lock doesn't match, so the upsert tries to insert a second "lock" and fails on the _id.
    await locks.updateOne(
      { _id: "lock", renewedAt: { $lt: new Date(now.getTime() - LOCK_STALE_MS) } },
      { $set: { owner, takenAt: now, renewedAt: now } },
      { upsert: true },
    );
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
  const renew = setInterval(() => {
    locks.updateOne({ _id: "lock", owner }, { $set: { renewedAt: new Date() } }).catch(() => {});
  }, LOCK_RENEW_MS);
  renew.unref();
  return {
    async release() {
      clearInterval(renew);
      await locks.deleteOne({ _id: "lock", owner });
    },
  };
}

// Runs the migrations that haven't run on this database, in order. A failure stops the run and throws, naming the
// migration. With `dryRun`, nothing is written (not even the lock): each one says what it would do, and what would
// stop it goes to `problem`. Returns the ids that ran, the ids still to run, and how many problems were found.
export async function runMigrations(
  db,
  { list = migrations, dryRun = false, log = console.log, problem = (text) => log(`Problem: ${text}`) } = {},
) {
  const notRun = async () => {
    const done = new Set(await db.collection("migrations").distinct("_id"));
    return list.filter((migration) => !done.has(migration.id));
  };
  let pending = await notRun();
  const result = { ran: [], pending: pending.map((migration) => migration.id), problems: 0 };
  if (!pending.length) return result;

  if (dryRun) {
    for (const migration of pending) {
      log(`${migration.id} will run: ${migration.description}`);
      const fail = (text) => {
        result.problems++;
        problem(`${migration.id}: ${text}`);
      };
      await migration.up(db, { dryRun: true, log: (text) => log(`  ${text}`), fail });
    }
    return result;
  }

  const lock = await takeLock(db);
  if (!lock) {
    log("Migrations: another server is running them");
    return { ...result, locked: true };
  }
  try {
    pending = await notRun(); // again: another server may have run some before this one took the lock
    for (const migration of pending) {
      const started = Date.now();
      log(`Migration ${migration.id}: ${migration.description}`);
      const fail = (text) => {
        throw new Error(text);
      };
      try {
        await migration.up(db, { dryRun: false, log: (text) => log(`  ${text}`), fail });
      } catch (error) {
        throw new Error(`${migration.id} stopped: ${error.message}`, { cause: error });
      }
      const ms = Date.now() - started;
      await db.collection("migrations").insertOne({ _id: migration.id, description: migration.description, ranAt: new Date(), ms });
      log(`Migration ${migration.id} done in ${ms} ms`);
      result.ran.push(migration.id);
    }
    result.pending = [];
    return result;
  } finally {
    await lock.release();
  }
}

// Whether a server runs the migrations when it starts: the deployed one, or one whose database is on this machine.
// A development server pointed at another machine's database (production's, if .env.local is missing) leaves them
// alone, so a migration that's still being written only ever runs locally.
export function shouldRunMigrations({ nodeEnv = env.NODE_ENV, uri = env.MONGO_URI } = {}) {
  if (nodeEnv === "production") return true;
  try {
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(uri).hostname);
  } catch {
    return false;
  }
}

// What this server's migrations did, for /api/health.
let status = { state: "not started" };
export const migrationStatus = () => status;

// What server.js runs once the server is answering requests. It never throws: a migration that fails is logged,
// shown in /api/health, and run again at the next start, and the site carries on (rule 1).
export async function runAtStartup(db, options = {}) {
  if (!shouldRunMigrations()) {
    console.warn("Migrations not run: this development server's database is on another machine. The deployed server runs them.");
    status = { state: "skipped" };
    return;
  }
  status = { state: "running" };
  try {
    const { pending, locked } = await runMigrations(db, options);
    if (!pending.length) (options.log ?? console.log)("Migrations: up to date");
    status = locked ? { state: "running on another server" } : { state: "done", latest: (options.list ?? migrations).at(-1)?.id ?? null };
  } catch (error) {
    console.error(`Migrations stopped: ${error.message}`);
    status = { state: "failed" };
  }
}
