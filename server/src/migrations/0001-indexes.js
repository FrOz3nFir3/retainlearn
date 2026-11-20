// The indexes the code relies on, made here rather than by Mongoose when the server starts (autoIndex is off:
// services/mongo.js): one account per username, per email and per Google account, and one report per person per set.
// Signing up, the profile and Google sign-in check these first, but two requests at once could both get past that.
// Where one is already there, it's kept as it is. On production (checked with `npm run check:data`, 2026-11-19),
// that's username, email and card_reports. Production's googleId index is older and has other options, so it's
// replaced, to make every database's the same.
import { ensureIndex } from "./ensureIndex.js";

export const id = "0001-indexes";
export const description = "one account per username, email and Google account; one report per person per set";

export async function up(db, ctx) {
  await ensureIndex(db, "users", { username: 1 }, { unique: true }, ctx);
  await ensureIndex(db, "users", { email: 1 }, { unique: true }, ctx);
  // Only accounts that have a Google id, since not everyone signs in with Google. `$exists` rather than
  // `$type: "string"`: a lookup by googleId can use this index, and couldn't use that one.
  const googleId = { unique: true, partialFilterExpression: { googleId: { $exists: true } } };
  await ensureIndex(db, "users", { googleId: 1 }, googleId, ctx, { replace: true });
  await ensureIndex(db, "card_reports", { card: 1, reporter: 1 }, { unique: true }, ctx);
}
