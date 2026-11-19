// For migrations: makes sure a collection has an index. One that's already there with the same fields and options is
// left alone (Mongoose made some when the server started, before the migrations did). Before making a unique index,
// it checks that no two documents share a value, which would make it fail, and says how many values are shared,
// never which. An index on the same fields with other options is a problem to sort out by hand: it isn't dropped.
import { isDeepStrictEqual } from "node:util";

const OPTIONS = ["unique", "sparse", "partialFilterExpression", "expireAfterSeconds"];
const optionsOf = (index) => Object.fromEntries(OPTIONS.map((option) => [option, index[option] === false ? undefined : index[option]]));

// How many values more than one document has, where the index would cover them. A missing field counts as null, as
// it does in the index.
async function countShared(collection, key, filter = {}) {
  const value = Object.fromEntries(Object.keys(key).map((field) => [field, { $ifNull: [`$${field}`, null] }]));
  const [{ shared = 0 } = {}] = await collection
    .aggregate([{ $match: filter }, { $group: { _id: value, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $count: "shared" }])
    .toArray();
  return shared;
}

export async function ensureIndex(db, collectionName, key, options, { dryRun, log, fail }) {
  const collection = db.collection(collectionName);
  const label = `${collectionName} ${Object.keys(key).join(" + ")}${options.unique ? " (unique)" : ""}`;
  const existing = await collection.indexes().catch((error) => {
    if (error.codeName === "NamespaceNotFound") return []; // no collection yet: making the index makes it
    throw error;
  });

  const sameFields = existing.find((index) => isDeepStrictEqual(Object.entries(index.key), Object.entries(key)));
  if (sameFields) {
    if (isDeepStrictEqual(optionsOf(sameFields), optionsOf(options))) return log(`${label}: already there`);
    return fail(`${label}: the index "${sameFields.name}" is on the same fields with other options. Drop it by hand first.`);
  }
  if (options.unique) {
    const shared = await countShared(collection, key, options.partialFilterExpression);
    if (shared) return fail(`${label}: ${shared} value(s) belong to more than one document. Make them unique first.`);
  }
  if (dryRun) return log(`${label}: will be made`);
  await collection.createIndex(key, options);
  log(`${label}: made`);
}
