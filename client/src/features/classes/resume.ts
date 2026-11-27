// Carrying on a class left halfway today (progress.classInProgress), but only the class asked for: the same kind and
// the same round, which its key holds ("quiz:3:…"), and for a class of picked items (a retry, the flashcards you
// missed, your pick) items among the ones asked for. Anything else starts afresh: leaving round 1 halfway and opening
// round 3 gives round 3 (until 2026-11-27 it gave round 1, and without its round). And what was answered before
// leaving, as your progress has it, so a quiz carried on shows those answers as right or missed, not as blanks.
import { dayKey } from "@retainlearn/core";
import type { ClassInProgress, ClassMode, FlashcardProgress, QuestionProgress, When } from "@retainlearn/core";

// What a class's key says it is: its round's number, "mix" for a mixed quiz, or "pick" for picked items.
export const keyRound = (round: number | null, mix = false): string => (round != null ? String(round) : mix ? "mix" : "pick");
const roundOfKey = (key: string): string => key.split(":")[1] ?? "";

type Asked = { round: string; ids: ReadonlySet<string> | null };
type Left = ClassInProgress & { ids: string[]; index: number };

// The class left halfway, if it's the one asked for and there's some of it still to do.
export function carryOn(left: ClassInProgress | null | undefined, mode: ClassMode, today: string, asked: Asked): Left | null {
  if (!left || left.mode !== mode || left.day !== today || !left.ids?.length) return null;
  const index = left.index ?? 0;
  if (index >= left.ids.length || roundOfKey(left.key) !== asked.round) return null;
  if (asked.ids && !left.ids.every((id) => asked.ids?.has(id))) return null;
  return { ...left, ids: left.ids, index };
}

const today = (at: unknown, when: When): boolean => at != null && dayKey(new Date(at as string), when.timeZone) === when.today;

// How each item answered before leaving went, as far as your progress says: missed today, or got right (a question)
// or seen (a flashcard) today. null: it doesn't say (another class has answered it since, say).
export const answeredBefore = (item: QuestionProgress | FlashcardProgress | undefined, when: When): boolean | null => {
  if (item?.missedOn === when.today) return false;
  const at = item && ("refreshedAt" in item ? item.refreshedAt : "seenAt" in item ? item.seenAt : null);
  return today(at, when) ? true : null;
};
