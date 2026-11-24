// The kinds of class, as the API names them (CLASS_MODES in packages/core) and as their URLs do, which are today's:
// /card/:id/review, /quiz, /focus-review and /focus-quiz (PLAN 14.13, rule 7).
import type { ClassMode } from "@retainlearn/core";

export const CLASS_KINDS: Record<ClassMode, { label: string; path: string }> = {
  review: { label: "Review", path: "review" },
  quiz: { label: "Quiz", path: "quiz" },
  reviewMissed: { label: "Go over what you missed", path: "focus-review" },
  retryMissed: { label: "Retry what you missed", path: "focus-quiz" },
};

export const modeOfPath = (path: string | undefined): ClassMode | null =>
  (Object.entries(CLASS_KINDS).find(([, kind]) => kind.path === path)?.[0] as ClassMode | undefined) ?? null;

export const classPath = (setId: string, mode: ClassMode): string => `/card/${setId}/${CLASS_KINDS[mode].path}`;
