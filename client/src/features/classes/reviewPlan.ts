// What a review asks (the prototype's ReviewClass buildSession):
// - a round: the one asked for (?round=n) or the next with flashcards you haven't seen; of its flashcards, the ones
//   you haven't seen, else all of them again;
// - your pick (?ids=…): the flashcards you chose in the classroom, in your order;
// - going over what you missed (the reviewMissed class): up to 4 flashcards you didn't recall all of, each asking only
//   the recall points you missed last time (all of them when it has no record of its points).
// A flashcard with fewer than MIN_POINTS points is reviewed whole. Plain functions with the recall points passed in
// (they read the answer's HTML in a browser), so they're tested without one (reviewPlan.test.ts).
import { MIN_POINTS, nextReview, orderedFlashcards, reviewLoad, roundState, setRounds } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";
import type { RecallPoint } from "./recallPoints.ts";

export type ReviewFlashcard = StudySetContent["flashcards"][number] & { points: RecallPoint[]; focused: boolean };
export type ReviewPlan = { title: string | null; flashcards: ReviewFlashcard[]; round: number | null; again: boolean; picked: boolean };

const MISSED_MAX = 4;

// Reviewed point by point, or whole.
export const byPoints = (flashcard: ReviewFlashcard): boolean => flashcard.points.length >= MIN_POINTS || flashcard.focused;

export function planReview(
  set: StudySetContent,
  progress: ProgressView | null | undefined,
  missedOnly: boolean,
  when: When,
  choice: { round?: number | null; picked?: ReadonlySet<string> | null },
  pointsOf: (answerHtml: string) => RecallPoint[],
): ReviewPlan {
  const withPoints = (flashcard: StudySetContent["flashcards"][number]): ReviewFlashcard => {
    const points = pointsOf(flashcard.answer);
    const last = new Map((progress?.flashcards[flashcard._id]?.points ?? []).map((p) => [p.key, p.knew]));
    const missed = missedOnly ? points.filter((p) => last.get(p.key) === false) : [];
    return { ...flashcard, points: missed.length ? missed : points, focused: missed.length > 0 };
  };
  const inOrder = orderedFlashcards(set.flashcards, progress?.order);
  if (missedOnly) {
    const missed = inOrder.filter((c) => progress?.flashcards[c._id]?.missedOn != null && (!choice.picked || choice.picked.has(c._id)));
    return { title: "Go over what you missed", flashcards: missed.slice(0, MISSED_MAX).map(withPoints), round: null, again: false, picked: false };
  }
  if (choice.picked) return { title: "Your pick", flashcards: inOrder.filter((c) => choice.picked?.has(c._id)).map(withPoints), round: null, again: false, picked: true };
  // The same load as the quiz's rounds (QuizClass), so a round number means the same flashcards in both.
  const rounds = setRounds(set, progress?.order, (c) => reviewLoad(pointsOf(c.answer).length));
  const states = rounds.map((r) => roundState(r, progress, when));
  const round = (choice.round ? rounds[choice.round - 1] : null) ?? nextReview(rounds, states) ?? rounds[0];
  if (!round) return { title: null, flashcards: [], round: null, again: false, picked: false };
  const unseen = round.flashcards.filter((c) => progress?.flashcards[c._id]?.seenAt == null);
  return { title: `Round ${round.n} of ${rounds.length}`, flashcards: (unseen.length ? unseen : round.flashcards).map(withPoints), round: round.n, again: !unseen.length, picked: false };
}
