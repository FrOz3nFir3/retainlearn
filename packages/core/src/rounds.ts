// A study set in rounds: a few flashcards in a row, reviewed and then quizzed. Ported from the prototype's
// data/rounds.js, reading progress as the server stores it (PLAN 14.3b).
// A round closes at about ROUND quiz questions or ROUND_POINTS recall points (a flashcard reviewed whole counts as
// WHOLE_LOAD), so each class takes a few minutes, and the quiz asks about exactly what the review covered. The rounds
// follow your own flashcard order when you've set one, the author's otherwise. What a round shows comes from your
// progress, so nothing extra is stored: reviewed from the flashcards you've seen, stars from the questions you hold
// as player cards and haven't missed since.
// Counting a flashcard's recall points reads its answer's HTML, which needs a browser, so the caller passes each
// flashcard's points count in (loadOf), and the rules stay plain.
import { daysSince } from "./days.ts";
import { isFading, isPlayerCard } from "./playerCards.ts";
import type { FlashcardProgress, ItemMap, QuestionProgress, When } from "./types.ts";

export const ROUND = 5; // quiz questions in a round, about
export const ROUND_POINTS = 16; // recall points in a round, about
export const MIN_POINTS = 2; // fewer recall points than this, and a flashcard is reviewed whole
export const WHOLE_LOAD = 4; // a flashcard reviewed whole, in recall points
export const MIX_READY = 3; // player cards you must hold in a set before a mixed quiz is worth it

type Card = { _id: string };
type Question = { _id: string; flashcardId?: string | null };
type ProgressLike = { flashcards?: ItemMap<FlashcardProgress>; questions?: ItemMap<QuestionProgress> } | null | undefined;

export type Round<C extends Card = Card, Q extends Question = Question> = {
  n: number;
  cards: C[];
  questions: Q[];
  load: number; // recall points to review
  cardIds: string[];
};

// How much reviewing a flashcard is, in recall points, from how many points its answer has.
export const reviewLoad = (points: number): number => (points >= MIN_POINTS ? points : WHOLE_LOAD);

// The set's flashcards in your order: the ones you've placed first, then any the author added since, in the set's
// order. order: flashcard ids, or nothing for the set's own order.
export function orderedCards<C extends Card>(cards: readonly C[], order: readonly string[] | null | undefined): C[] {
  if (!order?.length) return [...cards];
  const byId = new Map(cards.map((c) => [c._id, c]));
  const mine = order.flatMap((id) => byId.get(id) ?? []);
  const placed = new Set(mine.map((c) => c._id));
  return [...mine, ...cards.filter((c) => !placed.has(c._id))];
}

// A round is a few flashcards in a row with the questions linked to them, so a review and a quiz on the same topics.
// Questions linked to no flashcard of the set make rounds of their own at the end.
export function setRounds<C extends Card, Q extends Question>(
  set: { flashcards: readonly C[]; questions: readonly Q[] },
  order: readonly string[] | null | undefined,
  loadOf: (card: C) => number,
): Round<C, Q>[] {
  const ids = new Set(set.flashcards.map((c) => c._id));
  const byCard = new Map<string, Q[]>();
  const extra: Q[] = [];
  for (const q of set.questions) {
    if (q.flashcardId && ids.has(q.flashcardId)) byCard.set(q.flashcardId, [...(byCard.get(q.flashcardId) ?? []), q]);
    else extra.push(q);
  }

  const built: Omit<Round<C, Q>, "n" | "cardIds">[] = [];
  let round: Omit<Round<C, Q>, "n" | "cardIds"> | null = null;
  for (const card of orderedCards(set.flashcards, order)) {
    round ??= { cards: [], questions: [], load: 0 };
    round.cards.push(card);
    round.questions.push(...(byCard.get(card._id) ?? []));
    round.load += loadOf(card);
    if (round.questions.length >= ROUND || round.load >= ROUND_POINTS) {
      built.push(round);
      round = null;
    }
  }
  // A short last round joins the one before it.
  const last = built.at(-1);
  if (round && last && round.questions.length < 3 && round.load < ROUND_POINTS / 2) {
    last.cards.push(...round.cards);
    last.questions.push(...round.questions);
    last.load += round.load;
  } else if (round) built.push(round);
  for (let i = 0; i < extra.length; i += ROUND) built.push({ cards: [], questions: extra.slice(i, i + ROUND), load: 0 });
  return built.map((r, i) => ({ ...r, n: i + 1, cardIds: r.cards.map((c) => c._id) }));
}

const itemOf = <T>(map: ItemMap<T> | undefined, id: string): T | undefined => (map instanceof Map ? map.get(id) : map?.[id]);

export type RoundState = {
  total: number; // questions
  right: number; // held as player cards and not missed since
  retry: number; // missed, to go over
  untried: number; // not answered right yet, and not missed
  tried: boolean;
  stars: number; // 3: all right; 2: all but one (of 3 or more); 1: at least half; 0 otherwise
  fading: boolean; // one of its player cards is fading
  cards: number;
  reviewed: number; // its flashcards you've seen
  weak: number; // its flashcards you didn't recall all of, last time
};

// Where a round stands, from your progress in the set.
export function roundState(round: Round, progress: ProgressLike, when: When): RoundState {
  const question = (id: string) => itemOf(progress?.questions, id);
  const flashcard = (id: string) => itemOf(progress?.flashcards, id);
  const total = round.questions.length;
  const retry = round.questions.filter((q) => question(q._id)?.missedOn != null).length;
  const right = round.questions.filter((q) => isPlayerCard(question(q._id)) && question(q._id)?.missedOn == null).length;
  const tried = right + retry > 0;
  const stars = right === total ? 3 : total >= 3 && right >= total - 1 ? 2 : right > 0 && right >= Math.ceil(total / 2) ? 1 : 0;
  return {
    total,
    right,
    retry,
    untried: total - right - retry,
    tried,
    stars: tried && total ? stars : 0,
    fading: round.questions.some((q) => isFading(question(q._id), when)),
    cards: round.cards.length,
    reviewed: round.cardIds.filter((id) => flashcard(id)?.seenAt != null).length,
    weak: round.cardIds.filter((id) => flashcard(id)?.missedOn != null).length,
  };
}

export const reviewDone = (s: RoundState): boolean => s.reviewed >= s.cards;
// A round's quiz is done once every question in it has been answered: what you missed is then for "Retry".
export const quizDone = (s: RoundState): boolean => !s.untried;

// The round to quiz next: the first with questions not answered yet. replay: once they all have been, the one with
// the fewest stars, so a quiz opened from outside the classroom always has something to ask.
export function nextRound<R extends Round>(rounds: readonly R[], states: readonly RoundState[], replay = false): R | null {
  const fresh = rounds.findIndex((r, i) => r.questions.length > 0 && (states[i]?.untried ?? 0) > 0);
  if (fresh >= 0) return rounds[fresh] ?? null;
  if (!replay) return null;
  const weakest = rounds
    .map((r, i) => [r, states[i]] as const)
    .filter(([r, s]) => r.questions.length > 0 && s !== undefined && s.stars < 3)
    .sort((a, b) => (a[1]?.stars ?? 0) - (b[1]?.stars ?? 0))[0];
  return weakest?.[0] ?? null;
}

// The round to review next: the first with flashcards you haven't seen.
export const nextReview = <R extends Round>(rounds: readonly R[], states: readonly RoundState[]): R | null =>
  rounds.find((_, i) => states[i] !== undefined && !reviewDone(states[i])) ?? null;

// What to do next, in order: review a round, then quiz it, then the next round.
export function upNext<R extends Round>(rounds: readonly R[], states: readonly RoundState[]): { round: R; mode: "review" | "quiz" } | null {
  const i = rounds.findIndex((_, j) => states[j] !== undefined && (!reviewDone(states[j]) || !quizDone(states[j])));
  const round = rounds[i];
  const state = states[i];
  if (!round || !state) return null;
  return { round, mode: reviewDone(state) ? "quiz" : "review" };
}

// A mixed quiz: questions you already hold, from across the set, so it practises what you've learned rather than what
// you haven't met yet (that's what rounds are for). The fading ones first, then the ones remembered longest ago, at
// most two from any round, so topics really mix. Never one remembered today: asking again minutes later adds nothing
// (spacing is the point), so pressing it twice never repeats a question, and once everything you hold was asked today
// it waits for tomorrow. Questions you've missed are left to "Retry what you missed". random: for the tie-breaking
// shuffle (Math.random; a fixed one in tests).
type Mixable<Q> = { q: Q; round: number; fading: boolean; daysAgo: number };
function mixable<Q extends Question>(rounds: readonly Round<Card, Q>[], progress: ProgressLike, when: When): Mixable<Q>[] {
  return rounds.flatMap((r) =>
    r.questions.flatMap((q) => {
      const p = itemOf(progress?.questions, q._id);
      if (!isPlayerCard(p) || p.missedOn != null || p.refreshedAt == null) return [];
      const daysAgo = daysSince(p.refreshedAt, when);
      return daysAgo > 0 ? [{ q, round: r.n, fading: isFading(p, when), daysAgo }] : [];
    }),
  );
}

export function mixedQuestions<Q extends Question>(rounds: readonly Round<Card, Q>[], progress: ProgressLike, when: When, n = ROUND, random: () => number = Math.random): Q[] {
  const pool = mixable(rounds, progress, when);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as Mixable<Q>, pool[i] as Mixable<Q>];
  }
  pool.sort((a, b) => Number(b.fading) - Number(a.fading) || b.daysAgo - a.daysAgo);
  const out: Q[] = [];
  const perRound = new Map<number, number>();
  for (const x of pool) {
    if (out.length >= n) break;
    if ((perRound.get(x.round) ?? 0) >= 2) continue;
    perRound.set(x.round, (perRound.get(x.round) ?? 0) + 1);
    out.push(x.q);
  }
  for (const x of pool) if (out.length < n && !out.includes(x.q)) out.push(x.q);
  return out;
}

export const mixableCount = (rounds: readonly Round[], progress: ProgressLike, when: When): number => mixable(rounds, progress, when).length;

// A flashcard's question as a topic name, without the instruction around it: "Provide a detailed explanation of var,
// let and const, …" becomes "Var, let and const, …". text: the question as plain text.
const ASK =
  /^(please\s+)?(provide|give|write|create|show|build)\s+((a|an|some)\s+)?((simple|detailed|brief|thorough|advanced|complete|self-contained|clear|concise|practical|real-world|in-depth|short|full),?\s+)*(explanation|description|overview|comparison|deep\s+dive|code\s+examples?|examples?|implementation|demonstration|walkthrough)\s+(of|for|into|on|between|that\s+(illustrates?|shows?|demonstrates?|uses?|implements?|includes?))(\s+how\s+to\s+use)?\s*(the\s+following\b)?/i;

export function topicName(text: string, max = 70): string {
  const bare = text
    .replace(/^based\s+on\s+[^,]{3,80},\s*/i, "")
    .replace(ASK, "")
    .replace(/^(explain|describe|discuss|compare|what\s+(is|are)|how\s+(does|do|is|are))\s+(the\s+)?/i, "")
    .replace(/^[\s:,]+/, "")
    .trim();
  const name = bare.charAt(0).toUpperCase() + bare.slice(1);
  return name.length > max ? `${name.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : name;
}

// Just the topic, for a round's one-line summary: it ends at the first question mark, sentence, colon, aside or
// "explaining…" clause ("vs." isn't a sentence), without a dangling "to" or "that".
export function shortTopic(text: string): string {
  const name = topicName(text, 200).replace(/\bvs\.\s/gi, "vs ");
  const at = (re: RegExp, min = 3) => {
    const m = name.match(re);
    return m && m.index !== undefined && m.index >= min ? m.index : -1;
  };
  const cut = [at(/\?/), at(/\.\s/), at(/:\s/), at(/,\s/, 16), at(/\s\(/, 10), at(/,\s+(explaining|including|focusing|showing|covering)\b/)].filter((i) => i >= 0);
  const short = (cut.length ? name.slice(0, Math.min(...cut)) : name)
    .replace(/\s+(that\s+)?(demonstrates?|shows?|uses?|illustrates?|includes?)$/i, "")
    .replace(/\s+(to|for|that|which|and|of|in|with|using)$/i, "");
  return short.length > 44 ? `${short.slice(0, 43).replace(/\s+\S*$/, "")}…` : short;
}
