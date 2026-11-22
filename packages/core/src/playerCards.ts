// Player cards: the questions you've got right, kept in progress.questions (PLAN 14.3b). A card's level rises when you
// remember it again on a later day (answers.ts), and it fades once more days than its level's interval have passed
// since you last remembered it (refreshedAt). Ported from the prototype's game/cards.js, with days counted as the
// player's local days.
import { daysSince } from "./days.ts";
import type { QuestionProgress, When } from "./types.ts";

export const INTERVALS = [1, 3, 7, 16, 35] as const; // the days a player card stays fresh at levels 1 to 5
export const MAX_LEVEL = INTERVALS.length;

type PlayerCard = QuestionProgress & { level: number };

// Level 0 means answered but never got right, so not a card yet.
export const isPlayerCard = (q: QuestionProgress | null | undefined): q is PlayerCard => (q?.level ?? 0) >= 1;

const freshFor = (level: number): number => INTERVALS[Math.min(Math.floor(level), MAX_LEVEL) - 1] ?? INTERVALS[0];

// A card with no date to go by counts as fading, since nothing says it's fresh.
export function isFading(q: QuestionProgress | null | undefined, when: When): boolean {
  if (!isPlayerCard(q)) return false;
  if (q.refreshedAt == null) return true;
  return daysSince(q.refreshedAt, when) > freshFor(q.level);
}

// The level a card plays at: one lower while it's fading, but never below 1. 0 for a question that isn't a card.
export const effectiveLevel = (q: QuestionProgress | null | undefined, when: When): number =>
  isPlayerCard(q) ? Math.max(1, Math.min(q.level, MAX_LEVEL) - (isFading(q, when) ? 1 : 0)) : 0;
