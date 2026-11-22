// What an answer or a review changes in your progress. This is the only file that changes progress: progress.ts only
// reads it. Ported from the prototype store's recordClass. Each function takes one item's progress (or nothing, for an
// item you've never answered) and returns its new progress, leaving the one it was given alone. The server saves what
// they return (P1-07), and the client shows it straight away.
import { dayKey, daysSince } from "./days.ts";
import { MAX_LEVEL, isPlayerCard } from "./playerCards.ts";
import type { DateLike, FlashcardProgress, Id, QuestionItem, QuestionProgress, RecallMark } from "./types.ts";

// When an answer was given, and where: the player's time zone decides which day it was.
export type AnswerTime = { at: DateLike; timeZone?: string };

// Remembering a player card on a later day than last time moves it up a level (spaced repetition rewards remembering
// after a gap, and twice in one day proves little). Either way, it's refreshed.
function remembered(q: QuestionProgress & { level: number }, { at, timeZone = "UTC" }: AnswerTime) {
  const gap = q.refreshedAt == null || daysSince(q.refreshedAt, { today: dayKey(at, timeZone), timeZone }) >= 1;
  return { level: gap ? Math.min(MAX_LEVEL, q.level + 1) : q.level, refreshedAt: new Date(at) };
}

// A question answered. Right: a new player card at level 1, or a card remembered again, and off what you missed.
// Wrong: a card drops a level but never below 1 (you've learned it once), and the question goes on what you missed,
// from today.
export function answerQuestion(q: QuestionProgress | null | undefined, correct: boolean, time: AnswerTime): QuestionProgress {
  const was = q ?? {};
  if (correct) {
    const card = isPlayerCard(was) ? remembered(was, time) : { level: 1, refreshedAt: new Date(time.at) };
    return { ...was, ...card, right: (was.right ?? 0) + 1, missedOn: null };
  }
  const level = isPlayerCard(was) ? Math.max(1, was.level - 1) : 0;
  return { ...was, level, wrong: (was.wrong ?? 0) + 1, missedOn: dayKey(time.at, time.timeZone) };
}

// A flashcard reviewed. knew: you recalled all of it; anything less puts it on what you missed, from today. points:
// the recall points you marked, kept one per key, the latest mark winning.
export function reviewFlashcard(
  f: FlashcardProgress | null | undefined,
  knew: boolean,
  time: AnswerTime & { points?: readonly { key: string; knew: boolean }[] },
): FlashcardProgress {
  const was = f ?? {};
  const byKey = new Map<string, RecallMark>((was.points ?? []).map((p) => [p.key, p]));
  for (const p of time.points ?? []) byKey.set(p.key, { key: p.key, knew: p.knew, at: new Date(time.at) });
  return { ...was, seenAt: new Date(time.at), missedOn: knew ? null : dayKey(time.at, time.timeZone), points: [...byKey.values()] };
}

// Recalling a flashcard whole also refreshes the player cards of the questions linked to it, as remembering them
// would. A question that isn't a card stays as it is: only answering it makes one.
export const refreshPlayerCard = (q: QuestionProgress | null | undefined, time: AnswerTime): QuestionProgress | null | undefined =>
  isPlayerCard(q) ? { ...q, ...remembered(q, time) } : q;

// The questions linked to a flashcard (by their flashcardId), as id strings.
export const linkedQuestionIds = (set: { questions: readonly QuestionItem[] }, flashcardId: Id): string[] =>
  set.questions.filter((q) => q.flashcardId != null && String(q.flashcardId) === String(flashcardId)).map((q) => String(q._id));
