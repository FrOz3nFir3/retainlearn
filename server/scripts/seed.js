// Fills an empty local database with the made-up data the tests use (test/fixtures.js), for when there's no copy of
// production to work on. Local only, and only a database whose name starts with "retainlearn" (scripts/local-only.js).
// It reads MONGO_URI the way the server does (.env.local first).
//
//   npm run db:seed              only if the database is empty
//   npm run db:seed -- --reset   drop it first
import mongoose from "mongoose";
import env from "../src/config/env.js";
import Users from "../src/models/users/users.mongo.js";
import Cards from "../src/models/cards/cards.mongo.js";
import { cards, users } from "../test/fixtures.js";
import { assertLocalRetainlearn } from "./local-only.js";

async function seed() {
  const db = assertLocalRetainlearn(env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);
  try {
    if (process.argv.includes("--reset")) await mongoose.connection.db.dropDatabase();
    else if ((await Users.estimatedDocumentCount()) || (await Cards.estimatedDocumentCount())) {
      throw new Error(`"${db}" isn't empty. Use --reset to drop it first, or npm run db:copy to refill it from a copy.`);
    }
    await Users.create(users());
    await Cards.insertMany(cards());
    console.log(`Seeded "${db}": ${users().length} users, ${cards().length} study sets.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
