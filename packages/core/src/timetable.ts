// Today's timetable: the classes to take, picked across all your subjects (the question, 2026-11-13: "a student can
// study 5 subjects: how do we know which one to pick?"). It used to take the study set with the most misses and the
// one you were furthest through, so one subject could win every day while the others went cold, and nothing said why.
//
// The rule, as spaced repetition does it (what's about to be forgotten first, wherever it is), with every subject
// getting its turn. Each study set is scored:
// - what you missed that's due back (missed before today: today's misses wait a day), 3 each;
// - fading player cards, 2 each;
// - a set you haven't been in for 3 days or more, 2 a day, up to 40 (so a quiet subject climbs back);
// - a subject you added but never started, 10 for each of its sets (so it gets introduced);
// - a subject already on today's timetable counts for less (x0.6), so the others get their turn.
// With nothing scoring, it carries on where you're furthest through (in another subject first), or starts something
// new. Each period says why it's there, for the timetable bar and the coach.
//
// Ported from the prototype's data/timetable.js, with your path's current step as the first period (paths). Still to
// come, with its feature: a match as the last (the stadium, Phase 4).
import { fadingCount, studySetStats } from "./progress.ts";
import type { ProgressBySet, StudySetStats } from "./progress.ts";
import type { Day, StudySet } from "./types.ts";

export const CLASSES_A_DAY = 2;
const W = { missed: 3, fading: 2, coldPerDay: 2, coldFrom: 3, coldMax: 40, unstarted: 10, sameSubject: 0.6 };

// The four kinds of class: a review, a quiz, going over the flashcards you missed, and retrying the questions you missed.
export const CLASS_MODES = ["review", "quiz", "reviewMissed", "retryMissed"] as const;
export type ClassMode = (typeof CLASS_MODES)[number];
export type Why =
  | { kind: "missed" | "fading" | "cold"; n: number } // n: items due back, player cards fading, or days away
  | { kind: "continue"; n: number; of: number } // n of the set's flashcards reviewed
  | { kind: "new" }
  | { kind: "path"; n: number; of: number; title: string }; // step n of your path's of, in the path titled so
// A period, as activity.timetable keeps it. step: a path's step of picked flashcards ("pathId.stepId"), which its class
// keeps to (?step=).
export type Period = { kind: "class"; setId: string; mode: ClassMode; why: Why; done: boolean; step?: string };

// The path you follow's current step, as a period (core's pathPeriod): its set and subject, its class, and its place.
export type PathPeriod = { setId: string; category: string; mode: ClassMode; n: number; of: number; title: string; step: string | null };

type Reason = { score: number; mode: ClassMode; why: Why };

// How much a study set needs you today, and the main reason.
function need(st: StudySetStats, fading: number, subjectStarted: boolean): { score: number; main: Reason } {
  const due = st.dueFlashcards + st.dueQuestions;
  const daysAgo = st.daysAgo ?? 0;
  const cold = st.started && daysAgo >= W.coldFrom ? Math.min(W.coldMax, W.coldPerDay * daysAgo) : 0;
  const fresh = !st.started && !st.empty && !subjectStarted ? W.unstarted : 0;
  const first: ClassMode = st.flashcards ? "review" : "quiz";
  const reasons: [Reason, ...Reason[]] = [
    { score: W.missed * due, mode: st.dueFlashcards ? "reviewMissed" : "retryMissed", why: { kind: "missed", n: due } },
    { score: W.fading * fading, mode: "quiz", why: { kind: "fading", n: fading } },
    { score: cold, mode: first, why: { kind: "cold", n: daysAgo } },
    { score: fresh, mode: first, why: { kind: "new" } },
  ];
  const main = reasons.reduce((a, b) => (b.score > a.score ? b : a));
  return { score: reasons.reduce((n, r) => n + r.score, 0), main };
}

// sets: the study sets in your subjects, as studySetStats takes them, in a stable order (ties go to the first).
// progress: your progress by set id. subjects: the categories on your campus. path: the current step of the path you
// follow, the first period when its subject is on your campus (the prototype's). Returns up to CLASSES_A_DAY periods.
export function planDay({
  sets,
  progress = {},
  subjects,
  today,
  timeZone = "UTC",
  path = null,
}: {
  sets: readonly StudySet[];
  progress?: ProgressBySet;
  subjects: readonly string[];
  today: Day;
  timeZone?: string;
  path?: PathPeriod | null;
}): Period[] {
  const when = { today, timeZone };
  const rooms = sets
    .filter((set) => subjects.includes(set.category))
    .map((set) => {
      const p = progress[String(set._id)];
      return { st: studySetStats(set, p, when), fading: fadingCount(set, p, when) };
    });
  const startedSubjects = new Set(rooms.filter(({ st }) => st.started).map(({ st }) => st.category));
  const periods: Period[] = [];
  const usedSets = new Set<string>();
  const usedSubjects = new Set<string>();
  const add = (st: StudySetStats, mode: ClassMode, why: Why) => {
    periods.push({ kind: "class", setId: st.setId, mode, why, done: false });
    usedSets.add(st.setId);
    usedSubjects.add(st.category);
  };
  if (path && subjects.includes(path.category)) {
    periods.push({ kind: "class", setId: path.setId, mode: path.mode, why: { kind: "path", n: path.n, of: path.of, title: path.title }, done: false, ...(path.step ? { step: path.step } : {}) });
    usedSets.add(path.setId);
    usedSubjects.add(path.category);
  }

  while (periods.length < CLASSES_A_DAY) {
    const open = rooms.filter(({ st }) => !usedSets.has(st.setId) && !st.empty);
    let best: { st: StudySetStats; weighted: number; main: Reason } | null = null;
    for (const { st, fading } of open) {
      const { score, main } = need(st, fading, startedSubjects.has(st.category));
      const weighted = score * (usedSubjects.has(st.category) ? W.sameSubject : 1);
      if (weighted > 0 && (!best || weighted > best.weighted)) best = { st, weighted, main };
    }
    if (best) {
      add(best.st, best.main.mode, best.main.why);
      continue;
    }
    // Nothing pressing: carry on where you're furthest through (another subject first), or start something new.
    const going = open
      .map(({ st }) => st)
      .filter((st) => st.started && st.unreviewed > 0)
      .sort((a, b) => Number(usedSubjects.has(a.category)) - Number(usedSubjects.has(b.category)) || b.explored - a.explored)[0];
    const fresh = open.find(({ st }) => !st.started)?.st;
    const pick = going ?? fresh;
    if (!pick) break;
    add(pick, pick.flashcards ? "review" : "quiz", going ? { kind: "continue", n: going.reviewed, of: going.flashcards } : { kind: "new" });
  }
  return periods;
}
