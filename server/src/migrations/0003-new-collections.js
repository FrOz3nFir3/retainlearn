// The new collections for progress, the campus and history (PLAN 14.3b), with their indexes. They start empty and
// nothing reads them yet: the copy of today's data and the endpoints come next. `players` needs no index beyond its
// _id, so it appears with its first document. Paths get theirs when they're built.
// Indexes only where a read needs one: every index is rewritten by the writes that change its fields, and progress is
// written every few answers.
import { ensureIndex } from "./ensureIndex.js";
import { ensureTimeSeries } from "./ensureTimeSeries.js";

export const id = "0003-new-collections";
export const description = "the new collections for progress, the campus and history, with their indexes (still empty)";

export async function up(db, ctx) {
  // One per account and set. The same index finds one set's progress, or all of yours.
  await ensureIndex(db, "progress", { userId: 1, setId: 1 }, { unique: true }, ctx);
  // One per account and day: today's, and the last 30 days.
  await ensureIndex(db, "activity", { userId: 1, day: -1 }, { unique: true }, ctx);
  // Every answer, append-only. MongoDB adds the index on meta + at itself.
  await ensureTimeSeries(db, "answers", { timeField: "at", metaField: "meta", granularity: "seconds" }, ctx);
  // A set's history, newest first, a page at a time.
  await ensureIndex(db, "study_set_history", { setId: 1, at: -1 }, {}, ctx);
  // A set's suggestions, newest first; each is deleted by MongoDB a week after it's made (at expiresAt).
  await ensureIndex(db, "study_set_suggestions", { setId: 1, at: -1 }, {}, ctx);
  await ensureIndex(db, "study_set_suggestions", { expiresAt: 1 }, { expireAfterSeconds: 0 }, ctx);
}
