// Paths (P2-07, TRACKER step 4): the lists and a path's page for everyone; making, editing, deleting and copying one,
// its editors, suggestions, following it, testing out of a step and claiming its skill, for whoever's signed in and
// allowed. The rules are core's (paths.ts); the database's side is models/paths/paths.model.ts.
import type { Request, Response } from "express";
import {
  CampusQuery,
  PATHS_PER_PAGE,
  PATH_HISTORY_PER_PAGE,
  PATH_LIMITS,
  PathContent,
  PathDecline,
  PathEdit,
  PathEditorAdd,
  PathEditorParams,
  PathHistoryQuery,
  PathParams,
  PathStepParams,
  PathSuggest,
  PathSuggestionParams,
  PathsQuery,
  StudySetReport,
  TestOut,
  checkStep,
  checkTestOut,
  cleanStep,
  dayKey,
  mergeSuggestion,
  pathChanges,
  pathProgress,
  stepItems,
  testedOutKey,
} from "@retainlearn/core";
import type {
  NewPath,
  PathHistoryPage,
  PathListing,
  PathPerson,
  PathSkill,
  PathStepProgress,
  PathSuggestion,
  PathVersion,
  PathView,
  PathsPage,
  TestOutResult,
  When,
} from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import {
  addEditor,
  canSee,
  countPathsMadeSince,
  countSuggestionsSince,
  createPath,
  decideSuggestion,
  deletePath,
  historyPage,
  isAuthorOf,
  isEditorOf,
  listedNow,
  openSuggestionCounts,
  openSuggestions,
  pathById,
  pathsPage,
  peopleByIds,
  personByUsername,
  putSuggestion,
  removeEditor,
  reportPath,
  savePath,
  suggestionById,
  versionOf,
  withdrawSuggestion,
  yourSuggestion,
} from "#models/paths/paths.model.ts";
import type { PathDoc } from "#models/paths/paths.mongo.ts";
import type { PathSuggestionDoc } from "#models/pathSuggestions/pathSuggestions.mongo.ts";
import { stepSetsOf } from "#models/studySets/studySets.model.ts";
import type { PathStepSet } from "#models/studySets/studySets.model.ts";
import { progressInSets } from "#models/progress/progress.model.ts";
import { addSkill, addSubject, addTestedOut, followPath, pathsOf, playerOf, unfollowPath } from "#models/players/players.model.ts";
import { subjectSummary, subjectsFromProgress } from "#services/campus.ts";
import { replanToday } from "#models/activity/activity.model.ts";
import { TRUST, trustedFrom } from "#config/trust.config.js";
import { Types } from "mongoose";

export const pathsInput = { query: PathsQuery };
export const pathInput = { params: PathParams };
export const newPathInput = { body: PathContent };
export const editInput = { params: PathParams, body: PathEdit };
export const followInput = { params: PathParams, query: CampusQuery };
export const editorAddInput = { params: PathParams, body: PathEditorAdd };
export const editorInput = { params: PathEditorParams };
export const suggestInput = { params: PathParams, body: PathSuggest };
export const suggestionInput = { params: PathSuggestionParams };
export const declineInput = { params: PathSuggestionParams, body: PathDecline };
export const historyInput = { params: PathParams, query: PathHistoryQuery };
export const testOutInput = { params: PathStepParams, query: CampusQuery, body: TestOut };
export const skillInput = { params: PathParams, query: CampusQuery };
export const reportInput = { params: PathParams, body: StudySetReport };

const DAY_MS = 24 * 60 * 60 * 1000;
const NO_SUCH_PATH = { error: "There's no such path. It may have been deleted, or be private." };
const CHANGED = "The path changed since you opened it. Look at it again, then try once more.";

// Who's asking, on a route open to everyone (the session middleware puts the token on req when there is one).
const viewerOf = (req: Request): string | null => (req as Request & { token?: { id?: string } }).token?.id ?? null;
const todayIn = (tz: string): When => ({ today: dayKey(new Date(), tz), timeZone: tz });
const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

// New accounts (P0-14), as for study sets: fewer a day, and what they publish waits to be listed until they're trusted.
const isNewAccount = (userId: string) => trustedFrom(new Types.ObjectId(userId)) > new Date();
const dailyCap = (userId: string) => (isNewAccount(userId) ? TRUST.SETS_PER_DAY_NEW_ACCOUNT : TRUST.SETS_PER_DAY);
const listingFor = (userId: string): { listed?: false; listAt?: Date } => (isNewAccount(userId) ? { listed: false, listAt: trustedFrom(new Types.ObjectId(userId)) } : {});

// The path, if this person may see it.
async function visiblePath(id: string, userId: string | null): Promise<PathDoc | null> {
  const path = await pathById(id);
  return path && canSee(path, userId) ? path : null;
}

// A path's steps checked against their sets, as saving needs (decision 6): each set still there, in the path's
// subject, with something in the step; and a step added to a public path (not one already in it) on a listed set, as
// one only a link opens isn't one to send people to. Picked flashcards no longer in their set are dropped first.
// Answers the cleaned path, or what's wrong with it.
function checkedSteps(next: PathVersion, sets: Map<string, PathStepSet>, previous: PathVersion | null): { path: PathVersion } | { problem: string } {
  const path = { ...next, steps: next.steps.map((step) => cleanStep(step, sets.get(step.setId))) };
  const had = new Set(previous?.steps.map((s) => s.setId) ?? []);
  for (const [i, step] of path.steps.entries()) {
    const set = sets.get(step.setId);
    const check = checkStep(step, set, path.category);
    const which = `Step ${i + 1}`;
    if (check === "gone" || !set) return { problem: `${which}: its study set no longer exists. Take the step out.` };
    if (check === "empty") {
      return { problem: step.flashcardIds ? `${which}: none of its picked flashcards are in the set any more. Pick again, or take the step out.` : `${which}: its study set has nothing in it yet.` };
    }
    if (check === "elsewhere") return { problem: `${which}: its study set is in ${set.category}, not ${path.category}.` };
    if (path.visibility === "public" && !set.listed && !had.has(step.setId)) return { problem: `${which}: its study set isn't listed yet, so it can only go in a private path.` };
  }
  return { path };
}

// ---------- The lists, and a path's page ----------

// GET /api/paths?search=…&subject=…&mine=1&page=…: each path with the steps you can study in it and their flashcards,
// and signed in, what's yours in it, worked out by the rules its page uses. Three reads for the page: its steps' sets,
// your progress in them with your player, and its open suggestions.
export async function getPaths(req: Request, res: Response) {
  const { query } = inputOf<typeof pathsInput>(res);
  const me = viewerOf(req);
  if (query.mine && !me) return res.status(401).json({ error: "Sign in to see the paths you can edit." });
  const { paths, total } = await pathsPage({ search: query.search, subject: query.subject, mine: query.mine ? me : null, page: query.page });
  const versions = paths.map((p) => versionOf(p.doc));
  const sets = await stepSetsOf(versions.flatMap((v) => v.steps.map((s) => s.setId)));
  const mine = me
    ? await Promise.all([pathsOf(me), progressInSets(me, [...sets.keys()]), openSuggestionCounts(paths.filter((p) => isEditorOf(p.doc, me)).map((p) => p._id))])
    : null;
  // Mastery doesn't change with the day, so any time zone gives the same number of steps done.
  const when = todayIn("UTC");
  const listed: PathListing[] = paths.map(({ doc, ...path }, i) => {
    const version = versions[i] as PathVersion;
    const studied = version.steps.filter((s) => ["ok", "elsewhere"].includes(checkStep(s, sets.get(s.setId), version.category)));
    const flashcards = studied.reduce((n, s) => n + stepItems(s, sets.get(s.setId) as PathStepSet).flashcards.length, 0);
    let you: PathListing["you"] = null;
    if (me && mine) {
      const [player, progress, toReview] = mine;
      const done = pathProgress({ pathId: path._id, category: version.category, steps: studied, sets, progress, testedOut: player.testedOut, when }).done;
      you = { following: player.active === path._id, canEdit: isEditorOf(doc, me), isAuthor: isAuthorOf(doc, me), done, toReview: toReview.get(path._id) ?? 0 };
    }
    return { ...path, steps: studied.length, flashcards, you };
  });
  if (me) res.set("Cache-Control", "private, no-cache, must-revalidate");
  res.json({ paths: listed, total, page: query.page, pages: Math.ceil(total / PATHS_PER_PAGE) } satisfies PathsPage);
}

function suggestionView(s: PathSuggestionDoc, people: Map<string, PathPerson>, path: PathDoc): PathSuggestion {
  return {
    _id: String(s._id),
    by: people.get(String(s.by)) ?? null,
    at: new Date(s.at).toISOString(),
    expiresAt: new Date(s.expiresAt).toISOString(),
    status: s.status as PathSuggestion["status"],
    summary: s.summary ?? [],
    note: s.note ?? "",
    after: s.after as PathVersion,
    stale: new Date(s.version).getTime() !== new Date(path.contentAt).getTime(),
  };
}

// A path as its page shows it (PathView), for this person.
async function pathView(path: PathDoc, me: string | null): Promise<PathView> {
  const version = versionOf(path);
  const sets = await stepSetsOf(version.steps.map((s) => s.setId));
  const mine = me ? await Promise.all([pathsOf(me), progressInSets(me, [...sets.keys()]), yourSuggestion(String(path._id), me)]) : null;
  const people = await peopleByIds([path.authorId, ...(path.editorIds ?? []), ...(mine?.[2] ? [mine[2].by] : [])]);
  const editors = (path.editorIds ?? []).flatMap((id) => people.get(String(id)) ?? []);
  let you: PathView["you"] = null;
  if (me && mine) {
    const [player, progress, suggestion] = mine;
    const id = String(path._id);
    const progressView: Record<string, PathStepProgress> = {};
    for (const [setId, p] of Object.entries(progress)) {
      // Each flashcard as when you saw and missed it: its recall-point marks aren't needed here, and would be most of
      // the bytes (as the report card leaves them out).
      const flashcards = Object.fromEntries(Object.entries(p.flashcards).map(([fid, f]) => [fid, { seenAt: f?.seenAt ?? null, missedOn: f?.missedOn ?? null }]));
      progressView[setId] = { flashcards: flashcards as PathStepProgress["flashcards"], questions: p.questions, lastAt: iso(p.lastAt) };
    }
    const skill = player.skills.find((s) => s.pathId === id);
    you = {
      canEdit: isEditorOf(path, me),
      isAuthor: isAuthorOf(path, me),
      following: player.active === id,
      testedOut: player.testedOut.filter((key) => key.startsWith(`${id}.`)).map((key) => key.slice(id.length + 1)),
      progress: progressView,
      suggestion: suggestion ? suggestionView(suggestion, people, path) : null,
      skill: skill ? { at: skill.at.toISOString() } : null,
    };
  }
  return {
    ...version,
    _id: String(path._id),
    steps: version.steps.map((step) => {
      const set = sets.get(step.setId) ?? null;
      return { ...step, set, check: checkStep(step, set, version.category) };
    }),
    author: people.get(String(path.authorId)) ?? null,
    editors,
    copiedFrom: path.copiedFrom ? String(path.copiedFrom) : null,
    listed: listedNow(path),
    version: new Date(path.contentAt).toISOString(),
    you,
  };
}

// GET /api/paths/:id
export async function getPath(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  const me = viewerOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  // What's yours in it is yours: no shared cache keeps it.
  if (me) res.set("Cache-Control", "private, no-cache, must-revalidate");
  res.json(await pathView(path, me));
}

// ---------- Making, editing, deleting and copying ----------

// POST /api/paths  PathContent
export async function postPath(req: Request, res: Response) {
  const { body } = inputOf<typeof newPathInput>(res);
  const me = userIdOf(req);
  const cap = dailyCap(me);
  if ((await countPathsMadeSince(me, new Date(Date.now() - DAY_MS))) >= cap) {
    return res.status(429).json({ error: `You've made ${cap} paths in the last day, the most for now. Please try again tomorrow.` });
  }
  const checked = checkedSteps(body, await stepSetsOf(body.steps.map((s) => s.setId)), null);
  if ("problem" in checked) return res.status(400).json({ error: checked.problem });
  const id = await createPath({ authorId: me, version: checked.path, listing: listingFor(me) });
  res.status(201).json({ _id: id } satisfies NewPath);
}

// PUT /api/paths/:id  { path, version }
export async function putPath(req: Request, res: Response) {
  const { params, body } = inputOf<typeof editInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (!isEditorOf(path, me)) return res.status(403).json({ error: "Only the path's editors can change it. Suggest a change instead." });
  const current = versionOf(path);
  if (body.path.visibility !== current.visibility && !isAuthorOf(path, me)) {
    return res.status(403).json({ error: "Who can see the path is its author's call." });
  }
  const sets = await stepSetsOf([...current.steps, ...body.path.steps].map((s) => s.setId));
  const checked = checkedSteps(body.path, sets, current);
  if ("problem" in checked) return res.status(400).json({ error: checked.problem });
  if (new Date(body.version).getTime() !== new Date(path.contentAt).getTime()) return res.status(409).json({ error: CHANGED });
  const summary = pathChanges(current, checked.path, sets);
  if (summary.length && !(await savePath(params.id, path.contentAt, checked.path, { kind: "edited", by: me, summary }))) return res.status(409).json({ error: CHANGED });
  res.json(await pathView((await pathById(params.id)) as PathDoc, me));
}

// DELETE /api/paths/:id
export async function deletePathRoute(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (!isAuthorOf(path, me)) return res.status(403).json({ error: "Only the path's author can delete it." });
  await deletePath(params.id, me);
  res.status(204).end();
}

// POST /api/paths/:id/copy
export async function postCopy(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const cap = dailyCap(me);
  if ((await countPathsMadeSince(me, new Date(Date.now() - DAY_MS))) >= cap) {
    return res.status(429).json({ error: `You've made ${cap} paths in the last day, the most for now. Please try again tomorrow.` });
  }
  const version = versionOf(path);
  const title = `${version.title.slice(0, PATH_LIMITS.title - " (copy)".length).trim()} (copy)`;
  const id = await createPath({ authorId: me, version: { ...version, title, visibility: "private" }, listing: listingFor(me), copiedFrom: { id: params.id, title: version.title } });
  res.status(201).json({ _id: id } satisfies NewPath);
}

// ---------- Following it ----------

// PUT /api/paths/:id/follow?tz=…
export async function putFollow(req: Request, res: Response) {
  const { params, query } = inputOf<typeof followInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const when = todayIn(query.tz);
  const player = await playerOf(me, query.tz, () => subjectsFromProgress(me, when));
  // Its subject on your campus (decision 14), so its steps reach your timetable and have a building. A full campus
  // still follows it.
  if (!player.subjects?.some((s) => s.category === path.category)) await addSubject(me, await subjectSummary(me, path.category, when));
  await followPath(me, params.id);
  await replanToday(me, when.today);
  res.json({ following: true });
}

// DELETE /api/paths/:id/follow
export async function deleteFollow(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  await unfollowPath(userIdOf(req), params.id);
  res.status(204).end();
}

// ---------- Editors ----------

const editorsOf = async (id: string): Promise<{ editors: PathPerson[] }> => {
  const path = (await pathById(id)) as PathDoc;
  const people = await peopleByIds(path.editorIds ?? []);
  return { editors: (path.editorIds ?? []).flatMap((e) => people.get(String(e)) ?? []) };
};

// POST /api/paths/:id/editors  { username }
export async function postEditor(req: Request, res: Response) {
  const { params, body } = inputOf<typeof editorAddInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (!isEditorOf(path, me)) return res.status(403).json({ error: "Only the path's editors can add editors." });
  const person = await personByUsername(body.username);
  if (!person) return res.status(404).json({ error: "There's no one with that username." });
  if (!isEditorOf(path, person._id)) await addEditor(params.id, person._id);
  res.json(await editorsOf(params.id));
}

// DELETE /api/paths/:id/editors/:userId
export async function deleteEditor(req: Request, res: Response) {
  const { params } = inputOf<typeof editorInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (!isEditorOf(path, me)) return res.status(403).json({ error: "Only the path's editors can take editors off." });
  if (isAuthorOf(path, params.userId)) return res.status(400).json({ error: "The path's author is always one of its editors." });
  await removeEditor(params.id, params.userId);
  res.json(await editorsOf(params.id));
}

// ---------- Suggestions ----------

// GET /api/paths/:id/suggestions
export async function getSuggestions(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const found = isEditorOf(path, me) ? await openSuggestions(params.id) : [await yourSuggestion(params.id, me)].flatMap((s) => s ?? []);
  const people = await peopleByIds(found.map((s) => s.by));
  res.json({ suggestions: found.map((s) => suggestionView(s, people, path)) });
}

// PUT /api/paths/:id/suggestions/mine  { path, version }
export async function putSuggestionRoute(req: Request, res: Response) {
  const { params, body } = inputOf<typeof suggestInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (isEditorOf(path, me)) return res.status(409).json({ error: "You can edit this path: save your changes instead." });
  if (new Date(body.version).getTime() !== new Date(path.contentAt).getTime()) return res.status(409).json({ error: CHANGED });
  const cap = dailyCap(me);
  if ((await countSuggestionsSince(me, new Date(Date.now() - DAY_MS))) >= cap) {
    return res.status(429).json({ error: `You've sent ${cap} suggestions in the last day, the most for now. Please try again tomorrow.` });
  }
  const current = versionOf(path);
  // Who can see the path isn't a suggestion's to change.
  const sets = await stepSetsOf([...current.steps, ...body.path.steps].map((s) => s.setId));
  const checked = checkedSteps({ ...body.path, visibility: current.visibility }, sets, current);
  if ("problem" in checked) return res.status(400).json({ error: checked.problem });
  const summary = pathChanges(current, checked.path, sets);
  if (!summary.length) return res.status(400).json({ error: "This doesn't change anything yet." });
  const saved = await putSuggestion({ pathId: params.id, by: me, version: path.contentAt, before: current, after: checked.path, summary });
  res.json(suggestionView(saved, await peopleByIds([me]), path));
}

// DELETE /api/paths/:id/suggestions/mine
export async function deleteSuggestionRoute(req: Request, res: Response) {
  const { params } = inputOf<typeof pathInput>(res);
  await withdrawSuggestion(params.id, userIdOf(req));
  res.status(204).end();
}

// The suggestion, for one of its path's editors to decide on.
async function suggestionToDecide(req: Request, res: Response, ids: { id: string; suggestionId: string }) {
  const me = userIdOf(req);
  const path = await visiblePath(ids.id, me);
  if (!path) return void res.status(404).json(NO_SUCH_PATH);
  if (!isEditorOf(path, me)) return void res.status(403).json({ error: "Only the path's editors decide on its suggestions." });
  const suggestion = await suggestionById(ids.suggestionId);
  if (!suggestion || String(suggestion.pathId) !== ids.id) return void res.status(404).json({ error: "There's no such suggestion. It may have expired." });
  if (suggestion.status !== "open") return void res.status(409).json({ error: `This suggestion was ${suggestion.status} already.` });
  return { me, path, suggestion };
}

// POST /api/paths/:id/suggestions/:suggestionId/accept: its own changes applied to the path as it is now.
export async function acceptSuggestion(req: Request, res: Response) {
  const { params } = inputOf<typeof suggestionInput>(res);
  const found = await suggestionToDecide(req, res, params);
  if (!found) return;
  const { me, path, suggestion } = found;
  const current = versionOf(path);
  const merged = { ...mergeSuggestion(current, suggestion.before as PathVersion, suggestion.after as PathVersion), visibility: current.visibility };
  const sets = await stepSetsOf([...current.steps, ...merged.steps].map((s) => s.setId));
  const checked = checkedSteps(merged, sets, current);
  if ("problem" in checked) return res.status(409).json({ error: `This suggestion can't be applied to the path as it is now. ${checked.problem}` });
  const summary = pathChanges(current, checked.path, sets);
  if (summary.length && !(await savePath(params.id, path.contentAt, checked.path, { kind: "suggestion", by: me, from: String(suggestion.by), summary }))) {
    return res.status(409).json({ error: CHANGED });
  }
  await decideSuggestion(params.suggestionId, { status: "accepted", by: me, note: "" });
  res.json(await pathView((await pathById(params.id)) as PathDoc, me));
}

// POST /api/paths/:id/suggestions/:suggestionId/decline  { note }
export async function declineSuggestion(req: Request, res: Response) {
  const { params, body } = inputOf<typeof declineInput>(res);
  const found = await suggestionToDecide(req, res, params);
  if (!found) return;
  if (!(await decideSuggestion(params.suggestionId, { status: "declined", by: found.me, note: body.note }))) return res.status(409).json({ error: "This suggestion was decided already." });
  res.status(204).end();
}

// ---------- History ----------

// GET /api/paths/:id/history?page=…
export async function getHistory(req: Request, res: Response) {
  const { params, query } = inputOf<typeof historyInput>(res);
  const path = await visiblePath(params.id, viewerOf(req));
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const { entries, total } = await historyPage(params.id, query.page);
  const people = await peopleByIds(entries.flatMap((e) => (e.from ? [e.by, e.from] : [e.by])));
  res.json({
    entries: entries.map((e) => ({
      _id: String(e._id),
      at: new Date(e.at).toISOString(),
      kind: e.kind,
      by: people.get(String(e.by)) ?? null,
      from: e.from ? (people.get(String(e.from)) ?? null) : null,
      summary: e.summary ?? [],
    })),
    total,
    page: query.page,
    pages: Math.ceil(total / PATH_HISTORY_PER_PAGE),
  } satisfies PathHistoryPage);
}

// ---------- Testing out of a step, and the skill ----------

// POST /api/paths/:id/steps/:stepId/test-out?tz=…  { answers }
export async function postTestOut(req: Request, res: Response) {
  const { params, query, body } = inputOf<typeof testOutInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const step = versionOf(path).steps.find((s) => s.id === params.stepId);
  const set = step ? (await stepSetsOf([step.setId])).get(step.setId) : undefined;
  if (!step || !set) return res.status(404).json({ error: "There's no such step in this path." });
  const check = checkTestOut(step, set, body.answers);
  if (check === "noTestOut") return res.status(400).json({ error: "This step has no questions to test out with." });
  if (check === "notTheStep") return res.status(400).json({ error: "Those aren't this step's test-out questions." });
  if (check === "passed") {
    await playerOf(me, query.tz, () => subjectsFromProgress(me, todayIn(query.tz)));
    await addTestedOut(me, testedOutKey(params.id, params.stepId));
    await replanToday(me, todayIn(query.tz).today);
  }
  res.json({ passed: check === "passed" } satisfies TestOutResult);
}

// POST /api/paths/:id/skill?tz=…
export async function postSkill(req: Request, res: Response) {
  const { params, query } = inputOf<typeof skillInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  const version = versionOf(path);
  const sets = await stepSetsOf(version.steps.map((s) => s.setId));
  const when = todayIn(query.tz);
  const [progress, player] = await Promise.all([progressInSets(me, [...sets.keys()]), pathsOf(me)]);
  const along = pathProgress({ pathId: params.id, category: version.category, steps: version.steps, sets, progress, testedOut: player.testedOut, when });
  if (!along.complete) return res.status(409).json({ error: `Finish every step first: ${along.done} of ${along.total} done.` });
  await playerOf(me, query.tz, () => subjectsFromProgress(me, when));
  const skill = await addSkill(me, { pathId: params.id, title: version.title, at: new Date() });
  res.json({ pathId: params.id, title: skill.title, at: skill.at.toISOString() } satisfies PathSkill);
}

// ---------- Reports ----------

// POST /api/paths/:id/report  { reason, note }
export async function postReport(req: Request, res: Response) {
  const { params, body } = inputOf<typeof reportInput>(res);
  const me = userIdOf(req);
  const path = await visiblePath(params.id, me);
  if (!path) return res.status(404).json(NO_SUCH_PATH);
  if (isAuthorOf(path, me)) return res.status(400).json({ error: "You can't report your own path." });
  await reportPath(params.id, me, body);
  res.json({ ok: true });
}
