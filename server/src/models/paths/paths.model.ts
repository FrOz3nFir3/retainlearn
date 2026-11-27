// Paths (P2-07) in the database: the paths, their suggestions, history and reports, everything the endpoints read and
// write, in one place. The rules are core's (paths.ts); who may do what is the endpoints' (routes/paths).
import { Types } from "mongoose";
import { PATHS_PER_PAGE, PATH_HISTORY_PER_PAGE, PATH_SUGGESTION_DAYS } from "@retainlearn/core";
import type { PathHistoryKind, PathListing, PathPerson, PathVersion, PathVisibility } from "@retainlearn/core";
import Path from "#models/paths/paths.mongo.ts";
import type { PathDoc } from "#models/paths/paths.mongo.ts";
import PathSuggestion from "#models/pathSuggestions/pathSuggestions.mongo.ts";
import type { PathSuggestionDoc } from "#models/pathSuggestions/pathSuggestions.mongo.ts";
import PathHistory from "#models/pathHistory/pathHistory.mongo.ts";
import type { PathHistoryDoc } from "#models/pathHistory/pathHistory.mongo.ts";
import PathReport from "#models/pathReports/pathReports.mongo.ts";
import Users from "#models/users/users.mongo.js";
import { isListed, listedFilter } from "#models/cards/cards.model.js";
import { escapeRegex } from "#utils/textNormalization.js";
import { TRUST } from "#config/trust.config.js";

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));
const DAY_MS = 24 * 60 * 60 * 1000;
const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

// ---------- A path's content, as core has it ----------

type Content = Pick<PathDoc, "title" | "category" | "description" | "visibility" | "exam" | "steps">;

// The path's content as core's rules take it (PathVersion): ids as text, a whole-set step's flashcardIds null.
export function versionOf(path: Content): PathVersion {
  return {
    title: path.title,
    category: path.category,
    description: path.description ?? "",
    visibility: (path.visibility ?? "public") as PathVisibility,
    exam: path.exam ?? true,
    steps: (path.steps ?? []).map((s) => ({ id: s.id, setId: String(s.setId), flashcardIds: s.flashcardIds ? s.flashcardIds.map(String) : null, title: s.title ?? "" })),
  };
}

// ...and as the database keeps it.
const stored = (version: PathVersion) => ({
  title: version.title,
  category: version.category,
  description: version.description,
  visibility: version.visibility,
  exam: version.exam,
  steps: version.steps.map((s) => ({ id: s.id, setId: oid(s.setId), ...(s.flashcardIds ? { flashcardIds: s.flashcardIds.map(oid) } : {}), title: s.title })),
});

// ---------- Who can see it, and who can change it ----------

export const isAuthorOf = (path: Pick<PathDoc, "authorId">, userId: string | null): boolean => !!userId && String(path.authorId) === userId;
export const isEditorOf = (path: Pick<PathDoc, "authorId" | "editorIds">, userId: string | null): boolean =>
  isAuthorOf(path, userId) || (!!userId && (path.editorIds ?? []).some((id) => String(id) === userId));
// Public ones for everyone (listed or not: a link still opens one), private ones for their editors, deleted ones for
// nobody.
export const canSee = (path: Pick<PathDoc, "authorId" | "editorIds" | "visibility" | "deletedAt">, userId: string | null): boolean =>
  !path.deletedAt && (path.visibility === "public" || isEditorOf(path, userId));
export const listedNow = (path: Pick<PathDoc, "listed" | "listAt">): boolean => isListed(path);

// ---------- Reading ----------

export async function pathById(id: string): Promise<PathDoc | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return Path.findById(id).lean<PathDoc>();
}

// People as a path shows them: their public name and username, nothing else. Those whose accounts are gone are left
// out.
export async function peopleByIds(ids: readonly (string | Types.ObjectId)[]): Promise<Map<string, PathPerson>> {
  const wanted = [...new Set(ids.map(String))].filter((id) => Types.ObjectId.isValid(id)).map(oid);
  if (!wanted.length) return new Map();
  const users = await Users.find({ _id: { $in: wanted } }, { username: 1, name: 1 }).lean<{ _id: Types.ObjectId; username: string; name?: string }[]>();
  return new Map(users.map((u) => [String(u._id), { _id: String(u._id), username: u.username, name: u.name || u.username }]));
}

export async function personByUsername(username: string): Promise<PathPerson | null> {
  const user = await Users.findOne({ username: { $eq: username } }, { username: 1, name: 1 }).lean<{ _id: Types.ObjectId; username: string; name?: string }>();
  return user ? { _id: String(user._id), username: user.username, name: user.name || user.username } : null;
}

// A page of paths, the most recently changed first: listed public ones (of a subject, with a word in their title that
// starts with search), or the ones mine can edit (public or private, listed or not). Each listed as the lists show it
// (PathListing) but for its numbers, which the steps' sets and the viewer's progress give (routes/paths).
export type ListedPath = Omit<PathListing, "steps" | "flashcards" | "you"> & { doc: PathDoc };
export async function pathsPage(query: { search: string; subject?: string | undefined; mine: string | null; page: number }): Promise<{ paths: ListedPath[]; total: number }> {
  const match: Record<string, unknown> = { deletedAt: null };
  if (query.mine) match.$or = [{ authorId: oid(query.mine) }, { editorIds: oid(query.mine) }];
  else Object.assign(match, { visibility: "public" }, listedFilter());
  if (query.subject) match.category = query.subject;
  if (query.search) match.title = new RegExp(`(?:^|\\s)${escapeRegex(query.search)}`, "i");
  const [result] = await Path.aggregate<{ page: PathDoc[]; total: { n: number }[] }>([
    { $match: match },
    { $facet: { page: [{ $sort: { contentAt: -1, _id: 1 } }, { $skip: (query.page - 1) * PATHS_PER_PAGE }, { $limit: PATHS_PER_PAGE }], total: [{ $count: "n" }] } },
  ]);
  const rows = result?.page ?? [];
  const people = await peopleByIds(rows.map((r) => r.authorId));
  return {
    paths: rows.map((r) => ({
      _id: String(r._id),
      title: r.title,
      category: r.category,
      description: r.description ?? "",
      exam: r.exam ?? true,
      visibility: (r.visibility ?? "public") as PathVisibility,
      listed: listedNow(r),
      author: people.get(String(r.authorId)) ?? null,
      updatedAt: new Date(r.contentAt).toISOString(),
      doc: r,
    })),
    total: result?.total[0]?.n ?? 0,
  };
}

// How many open suggestions wait on each of these paths.
export async function openSuggestionCounts(pathIds: readonly string[]): Promise<Map<string, number>> {
  if (!pathIds.length) return new Map();
  const rows = await PathSuggestion.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { pathId: { $in: pathIds.map(oid) }, status: "open" } },
    { $group: { _id: "$pathId", n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

// ---------- Writing ----------

// How many paths this account has made since then (its daily cap), from the time in each path's _id.
export async function countPathsMadeSince(userId: string, since: Date): Promise<number> {
  return Path.countDocuments({ authorId: oid(userId), _id: { $gte: Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000)) } });
}

// A new path (or a copy), with its first history entry. listing: a new account's, unlisted until it's trusted.
export async function createPath(input: { authorId: string; version: PathVersion; listing: { listed?: false; listAt?: Date }; copiedFrom?: { id: string; title: string } }): Promise<string> {
  const at = new Date();
  const path = await Path.create({
    ...stored(input.version),
    authorId: oid(input.authorId),
    editorIds: [],
    copiedFrom: input.copiedFrom ? oid(input.copiedFrom.id) : null,
    contentAt: at,
    ...input.listing,
  });
  const id = String(path._id);
  await addHistory(id, { kind: "created", by: input.authorId, at, summary: [input.copiedFrom ? `Copied from "${input.copiedFrom.title}"` : "Made the path"] });
  return id;
}

// The path's content saved, if it's still the version it was read at (contentAt), with a history entry. Answers the
// new version, or null when it changed meanwhile (or was deleted).
export async function savePath(id: string, version: Date, next: PathVersion, entry: { kind: "edited" | "suggestion"; by: string; from?: string; summary: string[] }): Promise<Date | null> {
  const at = new Date();
  const result = await Path.updateOne({ _id: oid(id), contentAt: version, deletedAt: null }, { $set: { ...stored(next), contentAt: at } });
  if (!result.matchedCount) return null;
  await addHistory(id, { ...entry, at });
  return at;
}

// Taken down: hidden, kept. false: it was already.
export async function deletePath(id: string, by: string): Promise<boolean> {
  const at = new Date();
  const result = await Path.updateOne({ _id: oid(id), deletedAt: null }, { $set: { deletedAt: at } });
  if (result.matchedCount) await addHistory(id, { kind: "deleted", by, at, summary: ["Deleted the path"] });
  return result.matchedCount > 0;
}

export async function addEditor(id: string, userId: string): Promise<void> {
  await Path.updateOne({ _id: oid(id), deletedAt: null }, { $addToSet: { editorIds: oid(userId) } });
}

export async function removeEditor(id: string, userId: string): Promise<void> {
  await Path.updateOne({ _id: oid(id) }, { $pull: { editorIds: oid(userId) } });
}

// A report, once per person (sending it again changes nothing); once enough people have reported the path, it's out of
// the lists until it's listed by hand (as a study set: unlistCard).
export async function reportPath(id: string, by: string, report: { reason: string; note: string }): Promise<void> {
  await PathReport.updateOne({ pathId: oid(id), by: oid(by) }, { $setOnInsert: { ...report, at: new Date() } }, { upsert: true }).catch((error: unknown) => {
    if (!isDuplicateKey(error)) throw error; // the same report sent twice at once
  });
  if ((await PathReport.countDocuments({ pathId: oid(id) })) >= TRUST.REPORTS_TO_UNLIST) {
    await Path.updateOne({ _id: oid(id) }, { $set: { listed: false }, $unset: { listAt: 1 } });
  }
}

// ---------- History ----------

async function addHistory(pathId: string, entry: { kind: PathHistoryKind; by: string; from?: string | undefined; at: Date; summary: string[] }): Promise<void> {
  await PathHistory.create({ pathId: oid(pathId), at: entry.at, kind: entry.kind, by: oid(entry.by), ...(entry.from ? { from: oid(entry.from) } : {}), summary: entry.summary });
}

export async function historyPage(pathId: string, page: number): Promise<{ entries: PathHistoryDoc[]; total: number }> {
  const [entries, total] = await Promise.all([
    PathHistory.find({ pathId: oid(pathId) })
      .sort({ at: -1, _id: -1 })
      .skip((page - 1) * PATH_HISTORY_PER_PAGE)
      .limit(PATH_HISTORY_PER_PAGE)
      .lean<PathHistoryDoc[]>(),
    PathHistory.countDocuments({ pathId: oid(pathId) }),
  ]);
  return { entries, total };
}

// ---------- Suggestions ----------

// Your suggestion on the path, made or replaced (one open at a time), lasting 15 days from now.
export async function putSuggestion(input: { pathId: string; by: string; version: Date; before: PathVersion; after: PathVersion; summary: string[] }): Promise<PathSuggestionDoc> {
  const at = new Date();
  const set = { at, expiresAt: new Date(at.getTime() + PATH_SUGGESTION_DAYS * DAY_MS), version: input.version, before: input.before, after: input.after, summary: input.summary, note: "" };
  const write = () =>
    PathSuggestion.findOneAndUpdate({ pathId: oid(input.pathId), by: oid(input.by), status: "open" }, { $set: set }, { upsert: true, new: true }).lean<PathSuggestionDoc>();
  // Two sent at the same moment: the second finds the first's.
  const saved = await write().catch((error: unknown) => {
    if (isDuplicateKey(error)) return write();
    throw error;
  });
  if (!saved) throw new Error("The suggestion wasn't saved");
  return saved;
}

export async function withdrawSuggestion(pathId: string, by: string): Promise<boolean> {
  return (await PathSuggestion.deleteOne({ pathId: oid(pathId), by: oid(by), status: "open" })).deletedCount > 0;
}

// The open suggestions on a path, for its editors, newest first.
export async function openSuggestions(pathId: string): Promise<PathSuggestionDoc[]> {
  return PathSuggestion.find({ pathId: oid(pathId), status: "open" }).sort({ at: -1 }).lean<PathSuggestionDoc[]>();
}

// Your latest on a path (open, or decided and not yet gone).
export async function yourSuggestion(pathId: string, by: string): Promise<PathSuggestionDoc | null> {
  return PathSuggestion.findOne({ pathId: oid(pathId), by: oid(by) }).sort({ at: -1 }).lean<PathSuggestionDoc>();
}

export async function suggestionById(id: string): Promise<PathSuggestionDoc | null> {
  return Types.ObjectId.isValid(id) ? PathSuggestion.findById(id).lean<PathSuggestionDoc>() : null;
}

// Accepted or declined, if it's still open. false: it was decided already (or withdrawn).
export async function decideSuggestion(id: string, decision: { status: "accepted" | "declined"; by: string; note: string }): Promise<boolean> {
  const result = await PathSuggestion.updateOne({ _id: oid(id), status: "open" }, { $set: { status: decision.status, decidedBy: oid(decision.by), decidedAt: new Date(), note: decision.note } });
  return result.matchedCount > 0;
}

// How many suggestions this account has sent since then (its daily cap).
export async function countSuggestionsSince(by: string, since: Date): Promise<number> {
  return PathSuggestion.countDocuments({ by: oid(by), at: { $gte: since } });
}
