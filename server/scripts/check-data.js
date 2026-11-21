// Checks, read-only, that a database's data fits what this version of the server reads, before deploying it.
//
//   npm run check:data                               the database in MONGO_URI (.env.local: your local copy)
//   MONGO_URI="<production>" npm run check:data      production, over NetBird or as a one-off command in Dokploy
//
// It only reads: nothing is written, and no collection or index is created (autoIndex and autoCreate are off). It
// runs the server's own queries for sign-in, the categories and each set's page against the real documents, and
// lists what the migrations this version brings will do when it starts (a dry run: src/migrations). It prints
// counts, never anyone's details. Exit code 1 if something would break.
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { runMigrations } from "../src/migrations/runner.js";
import Users from "../src/models/users/users.mongo.js";
import Cards from "../src/models/cards/cards.mongo.js";
import { getAllCategoriesWithPagination, getCardById, listedFilter } from "../src/models/cards/cards.model.js";
import { userDetailsProjection } from "../src/utils/constants.js";

const where = (uri) => (uri || "(no MONGO_URI set)").replace(/\/\/[^@/]*@/, "//").split("?")[0];
let problems = 0;
const check = (good, text) => {
  console.log(`${good ? "  ok  " : "  FIX "} ${text}`);
  if (!good) problems++;
};
const note = (text) => console.log(`   ·   ${text}`);
const notArray = (field) => ({ [field]: { $not: { $type: "array" } } });

console.log(`Checking ${where(env.MONGO_URI)}, read-only\n`);
await mongoose.connect(env.MONGO_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 });

try {
  // --- The server: its version, and whether it's a replica set (needed for multi-document transactions).
  const admin = mongoose.connection.db.admin();
  const [{ version }, hello] = await Promise.all([admin.buildInfo(), admin.command({ hello: 1 })]);
  note(`MongoDB ${version}, ${hello.setName ? `replica set "${hello.setName}" (transactions available)` : "standalone (no multi-document transactions)"}\n`);

  // --- Accounts
  const accounts = await Users.countDocuments();
  console.log(`Accounts: ${accounts}`);
  check((await Users.countDocuments(notArray("studying"))) === 0, "every account has a studying list (sign-in counts it)");
  check((await Users.countDocuments({ email: { $not: { $type: "string" } } })) === 0, "every account has an email");
  const [{ n: unnormalised = 0 } = {}] = await Users.aggregate([
    { $match: { email: { $type: "string" } } },
    { $match: { $expr: { $ne: ["$email", { $toLower: { $trim: { input: "$email" } } }] } } },
    { $count: "n" },
  ]);
  check(unnormalised === 0, `emails are stored lowercase (signing in now lowercases what's typed): ${unnormalised} aren't`);
  const [{ n: shared = 0 } = {}] = await Users.aggregate([
    { $match: { email: { $type: "string" } } },
    { $group: { _id: { $toLower: { $trim: { input: "$email" } } }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $count: "n" },
  ]);
  check(shared === 0, `no two accounts share an email: ${shared} emails are shared`);
  const withPassword = await Users.countDocuments({ password: { $type: "string" } });
  const withGoogle = await Users.countDocuments({ googleId: { $type: "string" } });
  const neither = await Users.countDocuments({ password: { $not: { $type: "string" } }, googleId: { $not: { $type: "string" } } });
  note(`${withPassword} with a password, ${withGoogle} with Google, ${neither} with neither (they can't sign in)`);
  note(`${await Users.countDocuments({ tokenVersion: { $exists: true } })} have a token version (missing counts as 0, so sessions carry on)`);
  try {
    const read = await Users.find({}, { ...userDetailsProjection, _id: 1, password: 1, tokenVersion: 1 }).lean();
    check(read.length === accounts, "the sign-in read works for every account");
  } catch (error) {
    check(false, `the sign-in read fails: ${error.message}`);
  }

  // --- Study sets
  const sets = await Cards.countDocuments();
  console.log(`\nStudy sets: ${sets}`);
  const stillCards = (await mongoose.connection.db.listCollections({ name: "cards" }, { nameOnly: true }).toArray()).length > 0;
  if (!sets && stillCards) {
    note(`they're still in \`cards\` here: 0002 renames it to \`${Cards.collection.name}\` when this version starts, so check again after the deploy`);
  }
  const badLists = await Cards.countDocuments({ $or: [notArray("review"), notArray("quizzes"), notArray("reviewQueue")] });
  check(badLists === 0, `every set has flashcard, question and review-queue lists (its page counts them): ${badLists} don't`);
  const noCategory = await Cards.countDocuments({ category: { $not: { $type: "string" } } });
  check(noCategory === 0, `every set has a category: ${noCategory} don't`);
  const listed = await Cards.countDocuments(listedFilter());
  note(`${listed} listed, ${sets - listed} unlisted (a missing "listed" counts as listed)`);
  const { categories } = await getAllCategoriesWithPagination({ skip: 0, limit: 10000 });
  const inCategories = categories.reduce((n, c) => n + c.cardCount, 0);
  check(inCategories === listed, `the categories list shows every listed set (${inCategories} of ${listed})`);

  let pagesBroken = 0;
  let pagesUnlisted = 0;
  const ids = await Cards.find({}, { _id: 1 }).limit(1000).lean();
  for (const { _id } of ids) {
    try {
      const page = await getCardById(_id.toString());
      if (!page) pagesBroken++;
      else if (page.listed === false) pagesUnlisted++;
    } catch {
      pagesBroken++;
    }
  }
  check(pagesBroken === 0, `every set's page loads (${ids.length - pagesBroken} of ${ids.length})`);
  note(`${pagesUnlisted} of those pages ask search engines not to index them (unlisted sets)`);
  const [{ n: orphans = 0 } = {}] = await Cards.aggregate([
    {
      $lookup: {
        from: "users",
        let: { author: "$author" },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$author"] } } }, { $project: { _id: 1 } }],
        as: "a",
      },
    },
    { $match: { a: { $size: 0 } } },
    { $count: "n" },
  ]);
  note(`${orphans} sets whose author account no longer exists (their pages still load)`);
  const [{ biggest = 0 } = {}] = await Cards.aggregate([{ $group: { _id: null, biggest: { $max: { $bsonSize: "$$ROOT" } } } }]);
  note(`the biggest set is ${Math.round(biggest / 1024)} KB (MongoDB's limit is 16 MB)`);

  // --- Migrations: the ones this database hasn't had, which the server runs by itself when this version starts.
  // A dry run: each says what it would do, and anything that would stop it is a FIX.
  console.log("\nMigrations");
  const { pending } = await runMigrations(mongoose.connection.db, { dryRun: true, log: note, problem: (text) => check(false, text) });
  if (pending.length) note(`${pending.length} will run by themselves when this version starts: nothing to run by hand`);
  else check(true, "every migration has run");
} finally {
  await mongoose.disconnect();
}

console.log(problems ? `\n${problems} thing(s) to fix before deploying.` : "\nAll good: nothing to run by hand on this database, before or after deploying.");
process.exit(problems ? 1 : 0);
