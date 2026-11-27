// A path as its pages show it, worked out from the path's view (GET /api/paths/:id) by core's rules (paths.ts): where
// you are along it, each step's name and counts, what its editors should fix, and a picked step's own class. The
// prototype's PathPanel.jsx and data/paths.js.
import { pathProgress, stepItems, testedOutKey } from "@retainlearn/core";
import type { PathProgress, PathStepView, PathView, StepProgress, StepState, When } from "@retainlearn/core";
import { classPath } from "#features/classes/modes.ts";
import type { IconName } from "#components/ui/Icon.tsx";
import type { ChipTone } from "#components/ui/Chip.tsx";

export const pathPath = (id: string): string => `/paths/${id}`;
export const pathEditPath = (id: string): string => `/paths/${id}/edit`;
// A step as classes carry it (?step=): "pathId.stepId", as your test outs are kept.
export const stepParam = testedOutKey;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en")} ${n === 1 ? one : many}`;

// Where you are along the path: your progress in its steps' sets and the steps you tested out of (none signed out).
export function along(view: PathView, when: When): PathProgress {
  const sets = new Map(view.steps.flatMap((s) => (s.set ? [[s.set._id, s.set] as const] : [])));
  return pathProgress({
    pathId: view._id,
    category: view.category,
    steps: view.steps,
    sets,
    progress: view.you?.progress ?? {},
    testedOut: (view.you?.testedOut ?? []).map((stepId) => testedOutKey(view._id, stepId)),
    when,
  });
}

// A step's name: its own, or its set's.
export const stepName = (step: Pick<PathStepView, "title" | "set">): string => step.title || step.set?.title || "A removed study set";

// What a step holds: "12 flashcards, 4 quiz questions", or for picked flashcards "3 of 12 flashcards, 2 quiz questions".
export function stepCounts(step: Pick<PathStepView, "flashcardIds" | "set">): string {
  if (!step.set) return "";
  const { flashcards, questions } = stepItems(step, step.set);
  const cards = step.flashcardIds == null ? plural(flashcards.length, "flashcard") : `${flashcards.length.toLocaleString("en")} of ${plural(step.set.flashcards.length, "flashcard")}`;
  return `${cards}, ${plural(questions.length, "quiz question")}`;
}

// The step's state as its chip says it (the prototype's STATE): "Test passed" when you tested out.
export const STATE_CHIP: Record<StepState, { label: string; tone: ChipTone }> = {
  done: { label: "Mastered", tone: "mint" },
  current: { label: "Current step", tone: "brand" },
  open: { label: "Open", tone: "neutral" },
  locked: { label: "Later", tone: "cold" },
};

// What an editor should hear about content that changed under the path (learners skip what's gone), or null.
export function fixText(view: Pick<PathView, "steps">): string | null {
  const gone = view.steps.filter((s) => s.check === "gone").length;
  const empty = view.steps.filter((s) => s.check === "empty").length;
  const moved = view.steps.filter((s) => s.check === "elsewhere").length;
  const dropped = view.steps.reduce((n, s) => {
    if (!s.set || s.flashcardIds == null) return n;
    const there = new Set(s.set.flashcards.map((f) => String(f._id)));
    return n + s.flashcardIds.filter((id) => !there.has(id)).length;
  }, 0);
  const parts = [
    gone && `${plural(gone, "step")} lost ${gone === 1 ? "its" : "their"} study set`,
    empty && `${plural(empty, "step")} ${empty === 1 ? "has" : "have"} nothing left to study`,
    moved && `${plural(moved, "step's", "steps'")} study set moved to another subject`,
    dropped && `${plural(dropped, "picked flashcard")} ${dropped === 1 ? "was" : "were"} deleted`,
  ].filter(Boolean);
  return parts.length ? `${parts.join("; ")}. Learners skip what's gone.` : null;
}

// A picked step isn't in its set's rounds, so it's studied as one class of its own: what you missed first, else a
// review of its flashcards, else a quiz of its questions. href: the class, carrying the step.
export type StepClass = { label: string; note: string; icon: IconName; href: string };
export function pickedClass(pathId: string, entry: Pick<StepProgress, "step" | "set" | "stats">): StepClass {
  const step = `?step=${stepParam(pathId, entry.step.id)}`;
  const { stats } = entry;
  if (stats.missedFlashcards) return { label: "Go over what you missed", note: `${plural(stats.missedFlashcards, "flashcard")} in this step`, icon: "focus", href: `${classPath(entry.set._id, "reviewMissed")}${step}` };
  if (stats.flashcards) return { label: "Review this step", note: `The ${plural(stats.flashcards, "flashcard")} this path picked`, icon: "review", href: `${classPath(entry.set._id, "review")}${step}` };
  return { label: "Quiz this step", note: plural(stats.questions, "quiz question"), icon: "quiz", href: `${classPath(entry.set._id, "quiz")}${step}` };
}

// Testing out of a step: its quiz, as a test (TEST_OUT), carrying the step.
export const testOutHref = (pathId: string, setId: string, stepId: string): string => `${classPath(setId, "quiz")}?testout=1&step=${stepParam(pathId, stepId)}`;

// A step's place in a path (the classroom's banner, the lobby's badges): "pathId.stepId" back into its parts.
export function parseStep(param: string | null): { pathId: string; stepId: string } | null {
  const match = /^([0-9a-f]{24})\.([A-Za-z0-9_-]{1,24})$/.exec(param ?? "");
  return match ? { pathId: match[1] as string, stepId: match[2] as string } : null;
}
