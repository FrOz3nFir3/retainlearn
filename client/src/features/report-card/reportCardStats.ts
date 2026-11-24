// The report card's numbers (PLAN 14.10), worked out with the shared rules, so they agree with the campus and the
// classroom: each set you've started, as its row shows it, and the overview across them. A set here is counted (its
// titles and counts are copied onto your progress), so no set's content is read.
import { fadingCount, isPlayerCard, studySetStats, studySetStatus } from "@retainlearn/core";
import type { ReportCard, ReportCardSet, StudySet, StudySetStats, StudySetStatus, When } from "@retainlearn/core";

export type StudiedSet = {
  set: ReportCardSet;
  stats: StudySetStats;
  status: StudySetStatus;
  playerCards: number;
  fading: number;
};

export type Overview = {
  subjects: number;
  setsStarted: number;
  flashcardsReviewed: number;
  answers: number; // every answer, counting each try
  accuracy: number | null; // the share of answers that were right
  playerCards: number;
  fading: number;
};

const counted = (s: ReportCardSet): StudySet => ({ _id: s.setId, category: s.category, flashcards: s.flashcardCount, questions: s.questionCount });

// Your sets, the most recently studied first (ISO dates sort as text), then by name.
export function studiedSets(card: ReportCard, when: When): StudiedSet[] {
  return card.sets
    .map((set) => {
      const stats = studySetStats(counted(set), set, when);
      const fading = fadingCount(counted(set), set, when);
      return { set, stats, status: studySetStatus(stats, fading), playerCards: Object.values(set.questions).filter((q) => isPlayerCard(q)).length, fading };
    })
    .toSorted((a, b) => (b.set.lastAt ?? "").localeCompare(a.set.lastAt ?? "") || a.set.subtopic.localeCompare(b.set.subtopic));
}

export function overview(card: ReportCard, sets: readonly StudiedSet[]): Overview {
  const sum = (count: (s: StudiedSet) => number) => sets.reduce((n, s) => n + count(s), 0);
  const right = sum((s) => s.stats.right);
  const answers = right + sum((s) => s.stats.wrong);
  return {
    subjects: card.subjects,
    setsStarted: sets.length,
    flashcardsReviewed: sum((s) => s.stats.reviewed),
    answers,
    accuracy: answers ? right / answers : null,
    playerCards: sum((s) => s.playerCards),
    fading: sum((s) => s.fading),
  };
}

// Whether a set matches the search: every word typed, in its titles, in any case.
export function matchesSearch(s: StudiedSet, query: string): boolean {
  const text = `${s.set.subtopic} ${s.set.topic} ${s.set.category}`.toLocaleLowerCase();
  return query.toLocaleLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

// Whether there's anything to reset in a set's quizzes: an answer recorded, something missed, or a quiz counted.
export const hasQuizRecord = (set: ReportCardSet): boolean =>
  set.quiz.started > 0 || Object.values(set.questions).some((q) => (q.right ?? 0) + (q.wrong ?? 0) > 0 || q.missedOn != null);

// When you last studied, in words: "today", "yesterday", "3 days ago", then weeks, months and years. In English, like
// the rest of the app.
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function lastStudied(daysAgo: number): string {
  if (daysAgo < 7) return relative.format(-daysAgo, "day");
  if (daysAgo < 30) return relative.format(-Math.floor(daysAgo / 7), "week");
  if (daysAgo < 365) return relative.format(-Math.floor(daysAgo / 30), "month");
  return relative.format(-Math.floor(daysAgo / 365), "year");
}
