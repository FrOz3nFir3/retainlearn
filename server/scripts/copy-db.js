// Copies one local MongoDB database into another, collections and indexes. For example, your untouched copy of
// production (`repetitions`) into the working copy (`retainlearn`), to develop on or to rehearse a migration. The
// target is dropped first, so every copy starts clean. Local only, and only into a database whose name starts with
// "retainlearn" (scripts/local-only.js). Prints counts, never documents.
//
//   npm run db:copy                                     repetitions -> retainlearn
//   npm run db:copy -- --from repetitions --to retainlearn_rehearsal
import mongoose from "mongoose";
import { assertLocalRetainlearn } from "./local-only.js";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const base = process.env.LOCAL_MONGO ?? "mongodb://localhost:27017";
const from = arg("from", "repetitions");
const to = arg("to", "retainlearn");

async function copy() {
  assertLocalRetainlearn(`${base}/${to}`);
  if (from === to) throw new Error("Refusing: --from and --to are the same database");

  const client = new mongoose.mongo.MongoClient(base);
  await client.connect();
  try {
    const source = client.db(from);
    const collections = (await source.listCollections({ type: "collection" }).toArray()).filter((c) => !c.name.startsWith("system."));
    if (!collections.length) throw new Error(`"${from}" has no collections to copy`);

    await client.db(to).dropDatabase();
    for (const { name } of collections) {
      // Copied inside MongoDB ($out to another database), so documents never pass through this script.
      await source.collection(name).aggregate([{ $match: {} }, { $out: { db: to, coll: name } }]).toArray();
      const indexes = (await source.collection(name).indexes()).filter((index) => index.name !== "_id_");
      if (indexes.length) await client.db(to).collection(name).createIndexes(indexes.map(({ v, ns, ...index }) => index));
      const count = await client.db(to).collection(name).countDocuments();
      console.log(`${name}: ${count} documents, ${indexes.length} indexes besides _id`);
    }
    console.log(`Copied ${from} -> ${to}.`);
  } finally {
    await client.close();
  }
}

copy().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
