// The new collections for progress, the campus and history (PLAN 14.3b), with their indexes. They start empty and
// nothing reads them yet: the copy of today's data and the endpoints come next. `players` needs no index beyond its
// _id, so it appears with its first document. Paths get theirs when they're built.
import { ensureIndex } from "./ensureIndex.js";
import { ensureTimeSeries } from "./ensureTimeSeries.js";

export const id = "0002-new-collections";
export const description = "the new collections for progress, the campus and history, with their indexes (still empty)";

export async function up(db, ctx) {
  // One per account and set; the report card lists yours by when you last studied.
  await ensureIndex(db, "progress", { userId: 1, setId: 1 }, { unique: true }, ctx);
  await ensureIndex(db, "progress", { userId: 1, lastAt: -1 }, {}, ctx);
  // One per account and day: today's, and the last 30 days.
  await ensureIndex(db, "activity", { userId: 1, day: -1 }, { unique: true }, ctx);
  // Every answer. MongoDB adds the index on meta + at itself.
  await ensureTimeSeries(db, "answers", { timeField: "at", metaField: "meta", granularity: "seconds" }, ctx);
  // A set's history, newest first.
  await ensureIndex(db, "card_logs", { setId: 1, at: -1 }, {}, ctx);
  // A set's suggestions, newest first; each is deleted by MongoDB a week after it's made (at expiresAt).
  await ensureIndex(db, "review_queue", { setId: 1, submittedAt: -1 }, {}, ctx);
  await ensureIndex(db, "review_queue", { expiresAt: 1 }, { expireAfterSeconds: 0 }, ctx);
}
