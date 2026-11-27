// Paths (P2-07): the indexes of their four collections, which start empty. Indexes only where a read needs one, as in
// 0003: a subject's paths and the ones you write or edit; a path's suggestions (one open per person, each deleted by
// MongoDB at expiresAt, 15 days after it was sent) and yours lately (a daily cap); a path's history; one report per
// person per path.
import { ensureIndex } from "./ensureIndex.js";

export const id = "0006-paths";
export const description = "the indexes for paths, their suggestions, history and reports (still empty)";

export async function up(db, ctx) {
  await ensureIndex(db, "paths", { category: 1, contentAt: -1 }, {}, ctx);
  await ensureIndex(db, "paths", { authorId: 1 }, {}, ctx);
  await ensureIndex(db, "paths", { editorIds: 1 }, {}, ctx);
  await ensureIndex(db, "path_suggestions", { pathId: 1, at: -1 }, {}, ctx);
  await ensureIndex(db, "path_suggestions", { pathId: 1, by: 1 }, { unique: true, partialFilterExpression: { status: "open" } }, ctx);
  await ensureIndex(db, "path_suggestions", { by: 1, at: -1 }, {}, ctx);
  await ensureIndex(db, "path_suggestions", { expiresAt: 1 }, { expireAfterSeconds: 0 }, ctx);
  await ensureIndex(db, "path_history", { pathId: 1, at: -1 }, {}, ctx);
  await ensureIndex(db, "path_reports", { pathId: 1, by: 1 }, { unique: true }, ctx);
}
