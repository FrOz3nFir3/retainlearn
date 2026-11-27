// The kinds of class, named as the API names them (CLASS_MODES in packages/core), and their addresses, which use the
// same names (your decision, 2026-11-24): /study-sets/:id/review, /quiz, /review-missed and /retry-missed.
import type { ClassMode, StepAction } from "@retainlearn/core";

export const CLASS_KINDS: Record<ClassMode, { label: string; path: string }> = {
  review: { label: "Review", path: "review" },
  quiz: { label: "Quiz", path: "quiz" },
  reviewMissed: { label: "Go over what you missed", path: "review-missed" },
  retryMissed: { label: "Retry what you missed", path: "retry-missed" },
};

// A study set's address (its classroom), and a class's in it: the one place the scheme is written.
export const setPath = (setId: string): string => `/study-sets/${setId}`;
export const classPath = (setId: string, mode: ClassMode): string => `${setPath(setId)}/${CLASS_KINDS[mode].path}`;
// A timetable period's class: a path's step of picked flashcards keeps to the step (?step=).
export const periodPath = (period: { setId: string; mode: ClassMode; step?: string }): string => `${classPath(period.setId, period.mode)}${period.step ? `?step=${period.step}` : ""}`;
// The address of a step suggested by the next-step rule (core's studyPlan): its class, and which items.
export const stepPath = (setId: string, step: StepAction): string => {
  const query = step.round ? `?round=${step.round}` : step.mix ? "?mix=1" : step.ids?.length ? `?ids=${step.ids.join(",")}` : "";
  return `${classPath(setId, step.mode)}${query}`;
};

// Whether a path is a class's: a class takes the whole screen, with no top bar or tab bar.
const CLASS_PATH = new RegExp(`^/study-sets/[^/]+/(${Object.values(CLASS_KINDS).map((kind) => kind.path).join("|")})/?$`);
export const isClassPath = (pathname: string): boolean => CLASS_PATH.test(pathname);
