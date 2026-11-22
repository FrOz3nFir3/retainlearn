// What studying earns: XP for each answer, a bonus for finishing the day's timetable, levels from XP, and the daily
// streak. Ported from the prototype's store (recordClass, finishClass). The server works these out from what it saves;
// it never takes a number from the client.
import { daysBetween } from "./days.ts";
import type { Day } from "./types.ts";

export const XP = { questionRight: 12, questionWrong: 3, flashcard: 4, perPoint: 2, timetableDone: 50 } as const;
export const XP_PER_LEVEL = 300;
export const levelOf = (xp: number): number => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

// A quiz is marked for you, so a right answer earns more. A review earns for the effort, not the verdict: you mark
// your own recall, so "knew it" can't pay more than "didn't know" or it would pay to fib.
export const xpForQuestion = (correct: boolean): number => (correct ? XP.questionRight : XP.questionWrong);
export const xpForFlashcard = (points: number): number => XP.flashcard + XP.perPoint * Math.max(1, points);

// A flashcard counts as known when you recalled 80% of its recall points (the prototype's "perfect"). One reviewed
// whole, with no points, is known or not as you marked it.
export const KNEW_SHARE = 0.8;
export const knewFlashcard = (points: readonly { knew: boolean }[], knewWhole: boolean): boolean =>
  points.length ? points.filter((p) => p.knew).length / points.length >= KNEW_SHARE : knewWhole;

export type Streak = { count: number; lastDay: Day | null; freezes: number };

// The streak after finishing a class today. The first class of a day keeps it going: one more if you studied
// yesterday, or the day before with a freeze to cover the missed day (the freeze is used up). Otherwise it starts
// again at 1. Later classes the same day change nothing.
export function streakAfterClass(streak: Streak, today: Day): { streak: Streak; firstToday: boolean } {
  const gap = streak.lastDay ? daysBetween(streak.lastDay, today) : Infinity;
  if (gap < 1) return { streak, firstToday: false };
  if (gap === 1) return { streak: { ...streak, count: streak.count + 1, lastDay: today }, firstToday: true };
  if (gap === 2 && streak.freezes > 0) return { streak: { count: streak.count + 1, lastDay: today, freezes: streak.freezes - 1 }, firstToday: true };
  return { streak: { ...streak, count: 1, lastDay: today }, firstToday: true };
}

// The streak to show today, before any class: still going if you studied today or yesterday, or the day before with a
// freeze left to cover it. Otherwise it has ended, and shows 0 until the next class starts a new one.
export function currentStreak(streak: Streak, today: Day): number {
  if (!streak.lastDay) return 0;
  const gap = daysBetween(streak.lastDay, today);
  return gap <= 1 || (gap === 2 && streak.freezes > 0) ? streak.count : 0;
}
