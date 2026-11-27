// Paths (P2-07, TRACKER step 4): an ordered list of steps in one subject, each a whole study set or flashcards picked
// from one, that adds up to a skill. The rules the server and the client share, ported from the prototype's
// data/paths.js with the decisions agreed on 2026-11-27 (TRACKER step 4): what a path may hold, how far along one you
// are, testing out of a step, and what changed between two versions of one (its history, and suggestions).
import { z } from "zod";
import { MASTERED, studySetStats } from "./progress.ts";
import type { ProgressBySet, StudySetStats } from "./progress.ts";
import { ObjectIdHex, SubjectName } from "./schemas.ts";
import type { FlashcardItem, QuestionItem, When } from "./types.ts";

// ---------- What a path may hold ----------

export const PATH_LIMITS = { title: 80, description: 280, stepTitle: 60, steps: 40, picked: 500 } as const;
export const PATH_VISIBILITIES = ["public", "private"] as const;
export type PathVisibility = (typeof PATH_VISIBILITIES)[number];

const tidy = (text: string): string => text.replace(/\s+/g, " ");

// A step's id: its own, made by the editor that added it and kept as the path changes, so a test out and a suggestion
// follow the step, not its place.
export const StepId = z.string().regex(/^[A-Za-z0-9_-]{1,24}$/, "must be a step id");

// A step: a whole study set (flashcardIds null), or flashcards picked from it, under a name of its own ("" for the
// set's).
export const PathStepInput = z.object({
  id: StepId,
  setId: ObjectIdHex,
  flashcardIds: z
    .array(ObjectIdHex)
    .min(1, "Pick at least one flashcard, or take the whole set.")
    .max(PATH_LIMITS.picked, `Pick up to ${PATH_LIMITS.picked} flashcards.`)
    .nullable(),
  title: z.string().trim().max(PATH_LIMITS.stepTitle, `Keep the step's name to ${PATH_LIMITS.stepTitle} characters.`).transform(tidy),
});
export type PathStep = z.infer<typeof PathStepInput>;

// A path as its editors save it: its title, its subject, a description, who can see it, whether a final exam ends it,
// and its steps in order, each step's id once and each picked flashcard once. Whether each step's set is in the path's
// subject and still has something in it is the server's to check (it has the sets: checkStep).
export const PathContent = z
  .object({
    title: z.string().trim().min(1, "Give the path a title.").max(PATH_LIMITS.title, `Keep the title to ${PATH_LIMITS.title} characters.`).transform(tidy),
    category: SubjectName,
    description: z.string().trim().max(PATH_LIMITS.description, `Keep the description to ${PATH_LIMITS.description} characters.`),
    visibility: z.enum(PATH_VISIBILITIES),
    exam: z.boolean(),
    steps: z.array(PathStepInput).min(1, "Add at least one step.").max(PATH_LIMITS.steps, `A path has up to ${PATH_LIMITS.steps} steps.`),
  })
  .superRefine((path, ctx) => {
    const ids = new Set<string>();
    path.steps.forEach((step, i) => {
      if (ids.has(step.id)) ctx.addIssue({ code: "custom", path: ["steps", i, "id"], message: "Each step needs its own id." });
      ids.add(step.id);
      if (step.flashcardIds && new Set(step.flashcardIds).size !== step.flashcardIds.length) {
        ctx.addIssue({ code: "custom", path: ["steps", i, "flashcardIds"], message: "Pick each flashcard once." });
      }
    });
  });
export type PathVersion = z.infer<typeof PathContent>;

// ---------- A step's study set, and what's in the step ----------

// The study set a step draws on, as much of it as the rules need: its name, its subject, and its flashcards and
// questions (each question with the flashcard it's linked to, if any).
export type StepSet = { _id: string; title: string; category: string; flashcards: readonly FlashcardItem[]; questions: readonly QuestionItem[] };

// A step's flashcards and questions: the whole set's, or the picked flashcards still in the set and the questions
// linked to them.
export function stepItems(step: Pick<PathStep, "flashcardIds">, set: StepSet): { flashcards: FlashcardItem[]; questions: QuestionItem[] } {
  if (step.flashcardIds == null) return { flashcards: [...set.flashcards], questions: [...set.questions] };
  const picked = new Set(step.flashcardIds);
  const flashcards = set.flashcards.filter((f) => picked.has(String(f._id)));
  const kept = new Set(flashcards.map((f) => String(f._id)));
  return { flashcards, questions: set.questions.filter((q) => q.flashcardId != null && kept.has(String(q.flashcardId))) };
}

// Whether a step can be studied: "ok"; "gone" (its set was deleted) or "empty" (nothing left in it: the set has no
// flashcards or questions, or none of the picked flashcards are still there), both left out as you follow the path and
// shown to its editors to fix; "elsewhere" (its set moved to another subject), still studied, shown to its editors.
export type StepCheck = "ok" | "gone" | "empty" | "elsewhere";
export function checkStep(step: Pick<PathStep, "flashcardIds">, set: StepSet | null | undefined, category: string): StepCheck {
  if (!set) return "gone";
  const { flashcards, questions } = stepItems(step, set);
  if (!flashcards.length && !questions.length) return "empty";
  return set.category === category ? "ok" : "elsewhere";
}
const studiable = (check: StepCheck) => check === "ok" || check === "elsewhere";

// The step's picked flashcards that are still in its set (a whole-set step as it is). Saving a path, or a suggestion
// being accepted, keeps only those, so comparisons see real changes.
export function cleanStep<S extends Pick<PathStep, "flashcardIds">>(step: S, set: StepSet | null | undefined): S {
  if (step.flashcardIds == null || !set) return step;
  const there = new Set(set.flashcards.map((f) => String(f._id)));
  return { ...step, flashcardIds: step.flashcardIds.filter((id) => there.has(id)) };
}

// ---------- How far along a path you are ----------

// Your numbers in a step: core's study-set rules over the step's items (decision 7), so a whole-set step is mastered
// just as its classroom is, and a picked one goes by its own flashcards and questions.
export function stepStats(step: Pick<PathStep, "flashcardIds">, set: StepSet, progress: ProgressBySet[string], when: When): StudySetStats {
  return studySetStats({ _id: set._id, category: set.category, ...stepItems(step, set) }, progress, when);
}

// Practised: half the step's flashcards reviewed (half its questions answered, in a step without flashcards).
export const PRACTICED = 0.5;
const practised = (s: StudySetStats) => s.started && (s.flashcards ? s.explored : s.questions ? s.answered / s.questions : 0) >= PRACTICED;

// A step you tested out of, as your player record keeps it (players.paths.testedOut).
export const testedOutKey = (pathId: string, stepId: string): string => `${pathId}.${stepId}`;

// Where you are in each step you can study: "done" (mastered, or tested out; it follows your mastery, so a step can
// need you again), "current" (the first not done: where you're up to), "open" (a later one you've practised) or
// "locked" (the rest; only a label, as any step can be studied). complete: every step done (and at least one).
export type StepState = "done" | "current" | "open" | "locked";
export type StepProgress = { step: PathStep; set: StepSet; stats: StudySetStats; state: StepState; testedOut: boolean };
export type PathProgress = { steps: StepProgress[]; done: number; total: number; current: StepProgress | null; complete: boolean };
export function pathProgress(input: {
  pathId: string;
  category: string;
  steps: readonly PathStep[];
  sets: ReadonlyMap<string, StepSet>;
  progress: ProgressBySet;
  testedOut: readonly string[];
  when: When;
}): PathProgress {
  const passed = new Set(input.testedOut);
  const steps: StepProgress[] = [];
  let current: StepProgress | null = null;
  for (const step of input.steps) {
    const set = input.sets.get(step.setId);
    if (!set || !studiable(checkStep(step, set, input.category))) continue;
    const stats = stepStats(step, set, input.progress[step.setId], input.when);
    const testedOut = passed.has(testedOutKey(input.pathId, step.id));
    const state: StepState = testedOut || (stats.started && stats.mastery >= MASTERED) ? "done" : !current ? "current" : practised(stats) ? "open" : "locked";
    const entry: StepProgress = { step, set, stats, state, testedOut };
    if (state === "current") current = entry;
    steps.push(entry);
  }
  const done = steps.filter((s) => s.state === "done").length;
  return { steps, done, total: steps.length, current, complete: steps.length > 0 && done === steps.length };
}

// ---------- Testing out of a step ----------

// Up to 10 of the step's questions, one from each round before any round gets a second, and 80% right (rounded up)
// counts the step as done. (Five random ones, in the prototype at first: someone who knew 70% of a step got through
// about half the time, and a lucky draw could miss whole topics.) A step without questions has no test out.
export const TEST_OUT = { questions: 10, pass: 0.8 } as const;
export const testOutSize = (questions: number): number => Math.min(TEST_OUT.questions, questions);
export const testOutPass = (asked: number): number => Math.ceil(asked * TEST_OUT.pass);

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

// The questions a test out asks, from the step's rounds (setRounds over its items, built where the recall points are
// known): one from each round first, each round's in a random order, then all of them shuffled. random: Math.random,
// or a fixed one in tests.
export function testOutPick<Q>(rounds: readonly { questions: readonly Q[] }[], random: () => number = Math.random): Q[] {
  const byRound = rounds.map((r) => shuffled(r.questions, random));
  const asked: Q[] = [];
  for (let i = 0; asked.length < TEST_OUT.questions && byRound.some((r) => i < r.length); i++) {
    for (const r of byRound) if (i < r.length && asked.length < TEST_OUT.questions) asked.push(r[i] as Q);
  }
  return shuffled(asked, random);
}

// A test out as the browser marked it (as every class is), checked: as many of the step's questions as it asks, each
// once ("not the step's" otherwise), and whether enough were right.
export type TestOutAnswer = { questionId: string; right: boolean };
export type TestOutCheck = "passed" | "failed" | "notTheStep" | "noTestOut";
export function checkTestOut(step: Pick<PathStep, "flashcardIds">, set: StepSet, answers: readonly TestOutAnswer[]): TestOutCheck {
  const own = new Set(stepItems(step, set).questions.map((q) => String(q._id)));
  if (!own.size) return "noTestOut";
  const asked = new Set(answers.map((a) => a.questionId));
  if (asked.size !== answers.length || answers.length !== testOutSize(own.size) || answers.some((a) => !own.has(a.questionId))) return "notTheStep";
  return answers.filter((a) => a.right).length >= testOutPass(answers.length) ? "passed" : "failed";
}

// ---------- What changed: a path's history, and suggestions ----------

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// What changed between two versions of a path, in plain words: its fields, then its steps (removed, added, renamed,
// picked differently), then their order, explained by the step that moved furthest (on a tie, the one that moved up),
// repeated. sets: the steps' study sets, for their names and sizes.
export function pathChanges(before: PathVersion, after: PathVersion, sets: ReadonlyMap<string, StepSet>): string[] {
  const name = (step: PathStep) => step.title.trim() || sets.get(step.setId)?.title || "a removed study set";
  const size = (step: PathStep) =>
    step.flashcardIds == null ? `whole set, ${plural(sets.get(step.setId)?.flashcards.length ?? 0, "flashcard")}` : plural(step.flashcardIds.length, "flashcard");
  const out: string[] = [];
  if (after.title !== before.title) out.push(`Renamed to "${after.title}"`);
  if (after.category !== before.category) out.push(`Moved to the ${after.category} subject`);
  if (after.description !== before.description) out.push(after.description ? "Changed the description" : "Removed the description");
  if (after.exam !== before.exam) out.push(after.exam ? "Added a final exam" : "Removed the final exam");
  if (after.visibility !== before.visibility) out.push(after.visibility === "private" ? "Made it private" : "Made it public");
  const was = new Map(before.steps.map((s) => [s.id, s]));
  const now = new Map(after.steps.map((s) => [s.id, s]));
  for (const step of before.steps) if (!now.has(step.id)) out.push(`Removed step: ${name(step)}`);
  for (const step of after.steps) {
    const old = was.get(step.id);
    if (!old) {
      out.push(`Added step: ${name(step)} (${size(step)})`);
      continue;
    }
    if (step.title !== old.title) out.push(step.title ? `Renamed step ${name(old)} to "${step.title}"` : `Step ${name(old)} uses its set's name again`);
    if (JSON.stringify(step.flashcardIds) !== JSON.stringify(old.flashcardIds)) {
      out.push(`${name(step)}: now ${step.flashcardIds == null ? "the whole set" : plural(step.flashcardIds.length, "picked flashcard")}`);
    }
  }
  let a = after.steps.filter((s) => was.has(s.id)).map((s) => s.id);
  let b = before.steps.filter((s) => now.has(s.id)).map((s) => s.id);
  while (a.some((id, i) => id !== b[i])) {
    const moved = a.map((id, i) => ({ id, d: i - b.indexOf(id) })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.d - y.d)[0];
    if (!moved) break;
    const next = a[a.indexOf(moved.id) + 1];
    const step = now.get(moved.id) as PathStep;
    out.push(next ? `Moved ${name(step)} above ${name(now.get(next) as PathStep)}` : `Moved ${name(step)} to the end`);
    a = a.filter((id) => id !== moved.id);
    b = b.filter((id) => id !== moved.id);
  }
  return out;
}

// Accepting a suggestion applies its own changes (before → after) to the path as it is now, so edits made since aren't
// undone: the fields it changed, the steps it removed, edited and added, and its order for the steps it knows, steps
// added since keeping their place after their neighbour. Who can see the path stays its editors' call.
export function mergeSuggestion(current: PathVersion, before: PathVersion, after: PathVersion): PathVersion {
  const merged: PathVersion = { ...current };
  if (after.title !== before.title) merged.title = after.title;
  if (after.category !== before.category) merged.category = after.category;
  if (after.description !== before.description) merged.description = after.description;
  if (after.exam !== before.exam) merged.exam = after.exam;
  const was = new Map(before.steps.map((s) => [s.id, s]));
  const now = new Map(after.steps.map((s) => [s.id, s]));
  const edited = (id: string) => was.has(id) && now.has(id) && JSON.stringify(was.get(id)) !== JSON.stringify(now.get(id));
  const byId = new Map<string, PathStep>();
  for (const step of current.steps) if (now.has(step.id) || !was.has(step.id)) byId.set(step.id, edited(step.id) ? { ...step, ...now.get(step.id) } : step);
  for (const step of after.steps) if (!was.has(step.id)) byId.set(step.id, step);
  const order = after.steps.map((s) => s.id).filter((id) => byId.has(id));
  current.steps.forEach((step, i) => {
    if (was.has(step.id) || now.has(step.id)) return;
    const prev = current.steps
      .slice(0, i)
      .reverse()
      .find((p) => order.includes(p.id));
    order.splice(prev ? order.indexOf(prev.id) + 1 : 0, 0, step.id);
  });
  merged.steps = order.flatMap((id) => byId.get(id) ?? []);
  return merged;
}
