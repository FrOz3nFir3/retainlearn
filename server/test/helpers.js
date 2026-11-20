// Shared setup for the API tests: a clean local test database with the made-up data (fixtures.js), the app on a
// free port, and a small fetch helper. Run them with `npm test`, with MongoDB running locally and Redis from
// `docker compose up -d`.
import "./setup-env.js"; // first: the app reads its settings when it's imported
import mongoose from "mongoose";
import app from "../src/app.js";
import { initMongoDB, mongoDisconnect } from "../src/services/mongo.js";
import { redis } from "../src/services/redis.js";
import Users from "../src/models/users/users.mongo.js";
import Cards from "../src/models/cards/cards.mongo.js";
import { assertLocalRetainlearn } from "../scripts/local-only.js";
import { runMigrations } from "../src/migrations/runner.js";
import { cards, PASSWORD, users } from "./fixtures.js";

// The tests' Redis database (1, setup-env.js) is theirs alone, and it's emptied at the start of each test file, so
// rate-limit counts and sign-in "strikes" left by earlier runs can't block this one.
async function resetTestRedis() {
  const url = new URL(process.env.REDIS_URI);
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) || url.pathname !== "/1") {
    throw new Error("Refusing to empty a Redis database that isn't the local test one (database 1)");
  }
  if (redis.isReady) await redis.flushDb();
}

// The cookies a response sets, as the Cookie header a browser would send back.
export const cookiesOf = (res) => res.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");

export async function startApi() {
  // The run drops this database, so it must be the local test one, whatever the environment says.
  assertLocalRetainlearn(process.env.MONGO_URI, { exact: "retainlearn_test" });
  await initMongoDB();
  await mongoose.connection.db.dropDatabase();
  // The indexes, as on a deployed database: the migrations make them (Mongoose's autoIndex is off).
  await runMigrations(mongoose.connection.db, { log: () => {} });
  await resetTestRedis();
  await Users.create(users());
  await Cards.insertMany(cards());

  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = (path, init) => fetch(`${base}${path}`, init);

  return {
    api,
    // Sign in with a password. Returns the headers that make the next requests as that user: the session cookies
    // and the CSRF token, as the browser sends them.
    async signIn(loginIdentifier, password = PASSWORD) {
      const res = await api("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginIdentifier, password }),
      });
      if (res.status !== 200) throw new Error(`Sign-in as ${loginIdentifier} failed: ${res.status}`);
      const { csrfToken } = await res.json();
      return { Cookie: cookiesOf(res), "X-CSRF-Token": csrfToken, "Content-Type": "application/json" };
    },
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await mongoDisconnect();
      if (redis.isOpen) await redis.quit();
    },
  };
}
