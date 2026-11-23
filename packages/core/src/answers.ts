// What an answer or a review changes in your progress. This is the only file that changes progress: progress.ts only
// reads it. Ported from the prototype store's recordClass. Each function takes one item's progress (or nothing, for an
// item you've never answered) and returns its new progress, leaving the one it was given alone. The server saves what
// they return (P1-07), and the client shows it straight away.
import { dayKey, daysSince } from "./days.ts";
import { MAX_LEVEL, isPlayerCard } from "./playerCards.ts";
import { knewFlashcard, xpForFlashcard, xpForQuestion } from "./rewards.ts";
import type { DateLike, FlashcardProgress, Id, ItemMap, Progress, QuestionItem, QuestionProgress, RecallMark } from "./types.ts";

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

// The most recall points a review can mark, and a flashcard keeps: the latest marks. Editing an answer can leave keys
// that no longer exist, and this stops them piling up.
export const MAX_RECALL_POINTS = 30;

// A flashcard reviewed. knew: you recalled all of it; anything less puts it on what you missed, from today. points:
// the recall points you marked, kept one per key, the latest mark winning (and moving to the end, as the newest).
export function reviewFlashcard(
  f: FlashcardProgress | null | undefined,
  knew: boolean,
  time: AnswerTime & { points?: readonly { key: string; knew: boolean }[] },
): FlashcardProgress {
  const was = f ?? {};
  const byKey = new Map<string, RecallMark>((was.points ?? []).map((p) => [p.key, p]));
  for (const p of time.points ?? []) {
    byKey.delete(p.key);
    byKey.set(p.key, { key: p.key, knew: p.knew, at: new Date(time.at) });
  }
  const points = [...byKey.values()].slice(-MAX_RECALL_POINTS);
  return { ...was, seenAt: new Date(time.at), missedOn: knew ? null : dayKey(time.at, time.timeZone), points };
}

// Recalling a flashcard whole also refreshes the player cards of the questions linked to it, as remembering them
// would. A question that isn't a card stays as it is: only answering it makes one.
export const refreshPlayerCard = (q: QuestionProgress | null | undefined, time: AnswerTime): QuestionProgress | null | undefined =>
  isPlayerCard(q) ? { ...q, ...remembered(q, time) } : q;

// The questions linked to a flashcard (by their flashcardId), as id strings.
export const linkedQuestionIds = (set: { questions: readonly QuestionItem[] }, flashcardId: Id): string[] =>
  set.questions.filter((q) => q.flashcardId != null && String(q.flashcardId) === String(flashcardId)).map((q) => String(q._id));

// One answer in a class: a question answered, or a flashcard reviewed, with the recall points you marked. (What the
// API accepts, ClassAnswer in api.ts, fits this.)
export type GivenAnswer =
  | { kind: "question"; itemId: string; correct: boolean }
  | { kind: "flashcard"; itemId: string; knew: boolean; points?: readonly { key: string; knew: boolean }[] };

const itemOf = <T>(map: ItemMap<T> | undefined, id: string): T | undefined => (map instanceof Map ? map.get(id) : map?.[id]);

// A batch of a class's answers applied to a set's progress, in order. Returns only the items it changed (so the server
// can $set just those), how many player cards it earned, and the XP it earned. A flashcard counts as known from 80%
// of its recall points (knewFlashcard), and then also refreshes the cards of its linked questions.
export function applyAnswers(
  p: Progress | null | undefined,
  set: { questions: readonly QuestionItem[] },
  answers: readonly GivenAnswer[],
  time: AnswerTime,
): { flashcards: Record<string, FlashcardProgress>; questions: Record<string, QuestionProgress>; earned: number; xp: number } {
  const flashcards: Record<string, FlashcardProgress> = {};
  const questions: Record<string, QuestionProgress> = {};
  const question = (id: string) => questions[id] ?? itemOf(p?.questions, id);
  let earned = 0;
  let xp = 0;
  for (const answer of answers) {
    if (answer.kind === "question") {
      const was = question(answer.itemId);
      const now = answerQuestion(was, answer.correct, time);
      if (!isPlayerCard(was) && isPlayerCard(now)) earned++;
      questions[answer.itemId] = now;
      xp += xpForQuestion(answer.correct);
      continue;
    }
    const points = answer.points ?? [];
    const knew = knewFlashcard(points, answer.knew);
    flashcards[answer.itemId] = reviewFlashcard(flashcards[answer.itemId] ?? itemOf(p?.flashcards, answer.itemId), knew, { ...time, points });
    if (knew) {
      for (const id of linkedQuestionIds(set, answer.itemId)) {
        const was = question(id);
        if (isPlayerCard(was)) questions[id] = refreshPlayerCard(was, time) as QuestionProgress;
      }
    }
    xp += xpForFlashcard(points.length);
  }
  return { flashcards, questions, earned, xp };
}
