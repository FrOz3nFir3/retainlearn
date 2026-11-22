// Your progress in a study set and in a subject, and the one status a study set shows. It only reads progress
// (answers.ts changes it). Ported from the prototype's data/progress.js, reading the new progress documents (PLAN 14.3b).
//
// A study set comes either with its content or counted (types.ts). With content, only items still in the set count.
// Counted, progress is taken as it is: items deleted from a set leave its progress when the progress's setInfo is
// refreshed.
import { isFading } from "./playerCards.ts";
import { daysSince } from "./days.ts";
import type { DateLike, Id, ItemMap, Progress, StudySet, When } from "./types.ts";

export const MASTERED = 0.75; // a study set counts as mastered from here

// How mastery weighs reviewing against quizzing, in a set that has both. A set with only one kind is measured on that
// alone. (The prototype always used both weights, so a set with only flashcards topped out at 70%, and one with only
// questions at 30%: neither could ever be mastered.)
const WEIGHT = { review: 0.7, quiz: 0.3 };
// How much what you missed in a review holds it back: everything reviewed with a quarter of it missed counts as 85%.
const MISSED_PENALTY = 0.6;

// Your progress by set id.
export type ProgressBySet = Record<string, Progress | undefined>;

export type StudySetStats = {
  setId: string;
  category: string;
  flashcards: number; // how many the set has
  questions: number;
  empty: boolean; // nothing to study yet
  started: boolean;
  reviewed: number; // flashcards you've seen
  explored: number; // the share of the flashcards you've seen, 0 to 1
  unreviewed: number;
  missedFlashcardIds: string[]; // missed, and not recalled whole since
  missedQuestionIds: string[]; // missed, and not got right since
  missedFlashcards: number;
  missedQuestions: number;
  dueFlashcards: number; // missed before today, so due back (today's misses wait a day: a gap is what makes it stick)
  dueQuestions: number;
  answered: number; // questions you've answered at least once
  right: number; // answers, counting every try
  wrong: number;
  accuracy: number | null; // the share of your answers that were right
  mastery: number; // 0 to 1
  lastAt: DateLike | null;
  daysAgo: number | null; // days since you were last in the set
};

const sizeOf = (items: StudySet["flashcards"]): number => (typeof items === "number" ? items : items.length);
const idOf = (set: { _id: Id }): string => String(set._id);

// A progress map's entries, [id, item], limited to items still in the set when its content is known.
function inSet<T>(items: readonly { _id: Id }[] | number, map: ItemMap<T> | undefined): [string, T][] {
  const entries: [string, T][] = map instanceof Map ? [...map] : Object.entries<T>(map ?? {});
  if (typeof items === "number") return entries;
  const ids = new Set(items.map((item) => String(item._id)));
  return entries.filter(([id]) => ids.has(id));
}

// The numbers behind your progress in a study set. Mastery is 70% reviewing (the share of flashcards you've seen,
// held back by the ones you missed) and 30% quizzing (the share of answers right, times the share of questions
// answered).
export function studySetStats(set: StudySet, p: Progress | null | undefined, when: When): StudySetStats {
  const flashcards = sizeOf(set.flashcards);
  const questions = sizeOf(set.questions);
  const base = { setId: idOf(set), category: set.category, flashcards, questions, empty: !flashcards && !questions };
  if (!p) {
    return {
      ...base,
      started: false,
      reviewed: 0,
      explored: 0,
      unreviewed: flashcards,
      missedFlashcardIds: [],
      missedQuestionIds: [],
      missedFlashcards: 0,
      missedQuestions: 0,
      dueFlashcards: 0,
      dueQuestions: 0,
      answered: 0,
      right: 0,
      wrong: 0,
      accuracy: null,
      mastery: 0,
      lastAt: null,
      daysAgo: null,
    };
  }
  const seen = inSet(set.flashcards, p.flashcards);
  const asked = inSet(set.questions, p.questions);
  const missed = <T extends { missedOn?: string | null }>(entries: [string, T][]) => entries.filter(([, item]) => item?.missedOn);
  const due = <T extends { missedOn?: string | null }>(entries: [string, T][]) =>
    missed(entries).filter(([, item]) => (item.missedOn ?? "") < when.today).length;
  const missedFlashcardIds = missed(seen).map(([id]) => id);
  const missedQuestionIds = missed(asked).map(([id]) => id);
  const reviewed = Math.min(flashcards, seen.filter(([, f]) => f?.seenAt).length);
  let right = 0;
  let wrong = 0;
  let answered = 0;
  for (const [, q] of asked) {
    right += q?.right ?? 0;
    wrong += q?.wrong ?? 0;
    if ((q?.right ?? 0) + (q?.wrong ?? 0) > 0) answered++;
  }
  const explored = flashcards ? reviewed / flashcards : 0;
  const missedShare = reviewed ? Math.min(1, missedFlashcardIds.length / reviewed) : 0;
  const accuracy = right + wrong ? right / (right + wrong) : null;
  const coverage = questions ? Math.min(1, answered / questions) : 0;
  const parts: [weight: number, score: number][] = [];
  if (flashcards) parts.push([WEIGHT.review, explored * (1 - MISSED_PENALTY * missedShare)]);
  if (questions) parts.push([WEIGHT.quiz, (accuracy ?? 0) * coverage]);
  const weight = parts.reduce((n, [w]) => n + w, 0);
  return {
    ...base,
    started: true,
    reviewed,
    explored,
    unreviewed: flashcards - reviewed,
    missedFlashcardIds,
    missedQuestionIds,
    missedFlashcards: missedFlashcardIds.length,
    missedQuestions: missedQuestionIds.length,
    dueFlashcards: due(seen),
    dueQuestions: due(asked),
    answered,
    right,
    wrong,
    accuracy,
    mastery: weight ? parts.reduce((n, [w, score]) => n + w * score, 0) / weight : 0,
    lastAt: p.lastAt ?? null,
    daysAgo: p.lastAt != null ? daysSince(p.lastAt, when) : null,
  };
}

export type Temperature = "warm" | "cooling" | "cold";
export type SubjectStatus = "empty" | "new" | Temperature;

// How warm a subject is, from the days since you last studied it: its building cools while you stay away.
export const temperature = (daysAgo: number): Temperature => (daysAgo >= 4 ? "cold" : daysAgo >= 2 ? "cooling" : "warm");

// A subject's one status: nothing to study in it yet, not started, or how warm it is. A subject with no date to go
// by counts as cold.
export function subjectStatus({ empty, started, daysAgo }: { empty: boolean; started: number; daysAgo: number | null }): SubjectStatus {
  if (empty) return "empty";
  if (!started) return "new";
  return temperature(daysAgo ?? Infinity);
}

export type SubjectStats = {
  sets: StudySetStats[];
  flashcards: number;
  questions: number;
  started: number; // sets started
  mastery: number;
  missedFlashcards: number;
  missedQuestions: number;
  missed: number;
  accuracy: number | null;
  lastAt: DateLike | null;
  daysAgo: number | null;
  empty: boolean;
  status: SubjectStatus;
};

// A subject (a building on your campus): its study sets together, each counting by its size, flashcards plus
// questions. (The prototype weighed sets by their flashcards alone, so a set of only questions counted for nothing.)
export function subjectStats(sets: readonly StudySet[], progress: ProgressBySet, when: When): SubjectStats {
  const stats = sets.map((set) => studySetStats(set, progress[idOf(set)], when));
  const started = stats.filter((s) => s.started);
  const sum = (count: (s: StudySetStats) => number) => stats.reduce((n, s) => n + count(s), 0);
  const size = (s: StudySetStats) => s.flashcards + s.questions;
  const total = sum(size);
  const right = sum((s) => s.right);
  const wrong = sum((s) => s.wrong);
  const days = started.map((s) => s.daysAgo).filter((d): d is number => d != null);
  const daysAgo = days.length ? Math.min(...days) : null;
  const lastAt = started.reduce<DateLike | null>(
    (latest, s) => (s.lastAt != null && (latest == null || new Date(s.lastAt) > new Date(latest)) ? s.lastAt : latest),
    null,
  );
  const empty = stats.every((s) => s.empty);
  const missedFlashcards = sum((s) => s.missedFlashcards);
  const missedQuestions = sum((s) => s.missedQuestions);
  return {
    sets: stats,
    flashcards: sum((s) => s.flashcards),
    questions: sum((s) => s.questions),
    started: started.length,
    mastery: total ? sum((s) => s.mastery * size(s)) / total : 0,
    missedFlashcards,
    missedQuestions,
    missed: missedFlashcards + missedQuestions,
    accuracy: right + wrong ? right / (right + wrong) : null,
    lastAt,
    daysAgo,
    empty,
    status: subjectStatus({ empty, started: started.length, daysAgo }),
  };
}

export type StudySetStatus = { key: "empty" | "new" | "missed" | "fading" | "mastered" | "inProgress"; label: string };

// A study set's one status, in priority order, so it never shows two badges that disagree (the prototype once showed
// a finished path step's tick next to "11 to focus"). fading: how many of its player cards are fading (fadingCount).
export function studySetStatus(st: StudySetStats, fading = 0): StudySetStatus {
  if (st.empty) return { key: "empty", label: "Nothing to study yet" };
  if (!st.started) return { key: "new", label: "Not started" };
  const missed = st.missedFlashcards + st.missedQuestions;
  if (missed) return { key: "missed", label: `${missed} missed` };
  if (fading) return { key: "fading", label: `${fading} fading` };
  if (st.mastery >= MASTERED) return { key: "mastered", label: "Mastered" };
  return { key: "inProgress", label: "In progress" };
}

// How many of your player cards from a study set are fading.
export const fadingCount = (set: StudySet, p: Progress | null | undefined, when: When): number =>
  inSet(set.questions, p?.questions).filter(([, q]) => isFading(q, when)).length;

// Fading player cards per subject, as today's activity keeps them: [{ category, count }], for subjects that have some.
export function fadingBySubject(sets: readonly StudySet[], progress: ProgressBySet, when: When): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const set of sets) {
    const n = fadingCount(set, progress[idOf(set)], when);
    if (n) counts.set(set.category, (counts.get(set.category) ?? 0) + n);
  }
  return [...counts].map(([category, count]) => ({ category, count }));
}
