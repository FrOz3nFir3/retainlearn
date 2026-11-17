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
import { cards, users } from "./fixtures.js";

export async function startApi() {
  // The run drops this database, so it must be the local test one, whatever the environment says.
  assertLocalRetainlearn(process.env.MONGO_URI, { exact: "retainlearn_test" });
  await initMongoDB();
  await mongoose.connection.db.dropDatabase();
  await Users.create(users());
  await Cards.insertMany(cards());

  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  return {
    api: (path, init) => fetch(`${base}${path}`, init),
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await mongoDisconnect();
      if (redis.isOpen) await redis.quit();
    },
  };
}
