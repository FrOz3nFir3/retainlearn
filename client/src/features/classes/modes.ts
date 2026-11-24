// The kinds of class, named as the API names them (CLASS_MODES in packages/core), and their addresses, which use the
// same names (your decision, 2026-11-24): /study-sets/:id/review, /quiz, /review-missed and /retry-missed.
import type { ClassMode } from "@retainlearn/core";

export const CLASS_KINDS: Record<ClassMode, { label: string; path: string }> = {
  review: { label: "Review", path: "review" },
  quiz: { label: "Quiz", path: "quiz" },
  reviewMissed: { label: "Go over what you missed", path: "review-missed" },
  retryMissed: { label: "Retry what you missed", path: "retry-missed" },
};

// A study set's address (its classroom), and a class's in it: the one place the scheme is written.
export const setPath = (setId: string): string => `/study-sets/${setId}`;
export const classPath = (setId: string, mode: ClassMode): string => `${setPath(setId)}/${CLASS_KINDS[mode].path}`;

// Whether a path is a class's: a class takes the whole screen, with no top bar or tab bar.
const CLASS_PATH = new RegExp(`^/study-sets/[^/]+/(${Object.values(CLASS_KINDS).map((kind) => kind.path).join("|")})/?$`);
export const isClassPath = (pathname: string): boolean => CLASS_PATH.test(pathname);
