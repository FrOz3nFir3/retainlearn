// For migrations: makes sure a collection has an index. One that's already there with the same fields and options is
// left alone (Mongoose made some when the server started, before the migrations did). Before making a unique index,
// it checks that no two documents share a value, which would make it fail, and says how many values are shared,
// never which. An index on the same fields with other options is a problem to sort out by hand, unless the migration
// says to replace it (`{ replace: true }`): then it's dropped and made again, only once the check has passed, so a
// failed check leaves it as it was.
import { isDeepStrictEqual } from "node:util";

const OPTIONS = ["unique", "sparse", "partialFilterExpression", "expireAfterSeconds"];
const optionsOf = (index) => Object.fromEntries(OPTIONS.map((option) => [option, index[option] === false ? undefined : index[option]]));

// An index's options in words, e.g. `unique, sparse` or `not unique`.
function describe(index) {
  const { unique, sparse, partialFilterExpression, expireAfterSeconds } = optionsOf(index);
  return [
    unique ? "unique" : "not unique",
    sparse && "sparse",
    partialFilterExpression && `only where ${JSON.stringify(partialFilterExpression)}`,
    expireAfterSeconds !== undefined && `expires after ${expireAfterSeconds} s`,
  ]
    .filter(Boolean)
    .join(", ");
}

// How many values more than one document has, where the index would cover them. A missing field counts as null, as
// it does in the index.
async function countShared(collection, key, filter = {}) {
  const value = Object.fromEntries(Object.keys(key).map((field) => [field, { $ifNull: [`$${field}`, null] }]));
  const [{ shared = 0 } = {}] = await collection
    .aggregate([{ $match: filter }, { $group: { _id: value, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $count: "shared" }])
    .toArray();
  return shared;
}

export async function ensureIndex(db, collectionName, key, options, { dryRun, log, fail }, { replace = false } = {}) {
  const collection = db.collection(collectionName);
  const label = `${collectionName} ${Object.keys(key).join(" + ")}${options.unique ? " (unique)" : ""}${options.expireAfterSeconds !== undefined ? " (expiry)" : ""}`;
  const existing = await collection.indexes().catch((error) => {
    if (error.codeName === "NamespaceNotFound") return []; // no collection yet: making the index makes it
    throw error;
  });

  const old = existing.find((index) => isDeepStrictEqual(Object.entries(index.key), Object.entries(key)));
  if (old && isDeepStrictEqual(optionsOf(old), optionsOf(options))) return log(`${label}: already there`);
  if (old && !replace) {
    return fail(`${label}: the index "${old.name}" is on the same fields with other options (${describe(old)}). Drop it by hand first.`);
  }
  if (options.unique) {
    const shared = await countShared(collection, key, options.partialFilterExpression);
    if (shared) return fail(`${label}: ${shared} value(s) belong to more than one document. Make them unique first.`);
  }

  const replacing = old && `"${old.name}" (${describe(old)}) with one that's ${describe(options)}`;
  if (dryRun) return log(`${label}: ${replacing ? `will replace ${replacing}` : "will be made"}${options.unique ? "; no value is shared" : ""}`);
  if (old) await collection.dropIndex(old.name);
  await collection.createIndex(key, options);
  log(`${label}: ${replacing ? `replaced ${replacing}` : "made"}`);
}
