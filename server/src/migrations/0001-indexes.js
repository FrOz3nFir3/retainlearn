// The indexes the code relies on, made here rather than by Mongoose when the server starts (autoIndex is off:
// services/mongo.js). Two were made by Mongoose already wherever the server has run, and are left as they are: one
// account per username, and one report per person per set. New: one account per email, and per Google account.
// Signing up, the profile and Google sign-in check these first, but two requests at once could both get past it.
import { ensureIndex } from "./ensureIndex.js";

export const id = "0001-indexes";
export const description = "one account per username, email and Google account; one report per person per set";

export async function up(db, ctx) {
  await ensureIndex(db, "users", { username: 1 }, { unique: true }, ctx);
  await ensureIndex(db, "users", { email: 1 }, { unique: true }, ctx);
  // Only accounts that have a Google id, since not everyone signs in with Google. `$exists` rather than
  // `$type: "string"`: a lookup by googleId can use this index, and couldn't use that one.
  await ensureIndex(db, "users", { googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $exists: true } } }, ctx);
  await ensureIndex(db, "card_reports", { card: 1, reporter: 1 }, { unique: true }, ctx);
}
