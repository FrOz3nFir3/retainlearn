// What to do next in a study set, decided in one place for everywhere that suggests it: the classroom's Up next, the
// subject page's "Up next here" and its sets (and the coach and paths, to come). Ported from the prototype's
// data/next.js; its last step, the stadium, comes with the stadium.
//
// One next step, so nothing suggests two things at once:
// 1. a class you left halfway today, carried on;
// 2. what you missed before today (spaced repetition: what's due comes first; today's misses wait a little, since
//    going over a miss after a gap is what makes it stick);
// 3. the rounds in order (in Both: review a round, then quiz it, then the next round);
// 4. once every round is done: what you missed today, a mixed quiz to keep it all fresh, then round 1 again.
// view: what the classroom shows of each round (its review and quiz, or one of them); a set with only flashcards, or
// only questions, shows what it has.
import { MIX_READY, mixableCount, nextReview, nextRound, quizDone, upNext } from "./rounds.ts";
import type { Round, RoundState } from "./rounds.ts";
import type { ClassInProgress, StudyView } from "./api.ts";
import type { ClassMode } from "./timetable.ts";
import type { FlashcardProgress, ItemMap, QuestionProgress, When } from "./types.ts";

// A class to start: its kind, and which of the set's items (a round, the ones named, or a mixed quiz).
export type StepAction = { mode: ClassMode; round?: number; ids?: string[]; mix?: boolean };
export type NextStep = {
  kind: "continue" | "missed" | "round" | "mixed" | "again";
  icon: "review" | "quiz" | "focus" | "layers";
  label: string;
  note: string;
  // A round in Both: its review and its quiz, the done one ticked, the one it starts lit.
  steps?: { text: string; state: "done" | "now" | "later" }[];
  round?: number;
  action: StepAction;
};
export type StudyPlan = {
  view: StudyView;
  next: NextStep | null;
  current: number | null; // the round marked in the list: where you are
  currentTag: "Up next" | "Next round"; // "Next round" when Up next is something else (your misses, say)
  others: NextStep[]; // what else there is to do here, never what Up next offers: your misses, a mixed quiz
};

type Flashcard = { _id: string };
type Question = { _id: string; flashcardId?: string | null };
type ProgressLike = { flashcards?: ItemMap<FlashcardProgress>; questions?: ItemMap<QuestionProgress>; classInProgress?: ClassInProgress | null } | null | undefined;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// "quiz questions", not "questions": a flashcard has a question too.
const count = (flashcards: number, questions: number) => [flashcards && plural(flashcards, "flashcard"), questions && plural(questions, "quiz question")].filter(Boolean).join(", ");
const itemOf = <T>(map: ItemMap<T> | undefined, id: string): T | undefined => (map instanceof Map ? map.get(id) : map?.[id]);

// A round class left halfway today, with something done (not one you only opened, nor one of picked items: a retry,
// the flashcards you missed): its round ("mix" for a mixed quiz) and how far it got. Its key says what it is ("quiz:3:…").
export function leftToday(left: ClassInProgress | null | undefined, when: When): { mode: "review" | "quiz"; round: number | "mix"; index: number; of: number } | null {
  if (!left || left.day !== when.today || (left.mode !== "review" && left.mode !== "quiz") || !left.ids?.length) return null;
  const index = left.index ?? 0;
  if (index <= 0 || index >= left.ids.length) return null;
  const said = left.key.split(":")[1] ?? "";
  const round = said === "mix" ? "mix" : Number(said);
  if (round !== "mix" && !(Number.isInteger(round) && round > 0)) return null;
  return { mode: left.mode, round, index, of: left.ids.length };
}

export function studyPlan<C extends Flashcard, Q extends Question>(input: {
  rounds: readonly Round<C, Q>[];
  states: readonly RoundState[];
  progress: ProgressLike;
  when: When;
  view: StudyView; // as chosen: what the set has decides in the end
  loadOf: (flashcard: C) => number; // a flashcard's recall points, as for setRounds
}): StudyPlan {
  const { rounds, states, progress, when, loadOf } = input;
  const hasFlashcards = rounds.some((r) => r.flashcards.length > 0);
  const hasQuestions = rounds.some((r) => r.questions.length > 0);
  const view: StudyView = hasFlashcards && hasQuestions ? input.view : hasQuestions ? "quiz" : "review";
  const withReview = view !== "quiz";
  const withQuiz = view !== "review";

  const flashcardIds = rounds.flatMap((r) => r.flashcardIds);
  const questionIds = rounds.flatMap((r) => r.questions.map((q) => q._id));
  const missedOn = (map: ItemMap<FlashcardProgress | QuestionProgress> | undefined, id: string) => itemOf(map, id)?.missedOn ?? null;
  const missedCards = withReview ? flashcardIds.filter((id) => missedOn(progress?.flashcards, id) != null) : [];
  const missedQuestions = withQuiz ? questionIds.filter((id) => missedOn(progress?.questions, id) != null) : [];
  const misses = missedCards.length + missedQuestions.length;
  const missedNote = count(missedCards.length, missedQuestions.length);
  const goOver: StepAction = missedCards.length ? { mode: "reviewMissed" } : { mode: "retryMissed" };
  // Missed before today: due now. Today's wait (step 4).
  const dueCards = missedCards.filter((id) => missedOn(progress?.flashcards, id) !== when.today);
  const dueQuestions = missedQuestions.filter((id) => missedOn(progress?.questions, id) !== when.today);
  const mixOpen = withQuiz && mixableCount(rounds, progress, when) >= MIX_READY;

  const left = leftToday(progress?.classInProgress, when);
  const continued = left && (left.mode === "review" ? withReview : withQuiz) ? left : null;

  const path =
    view === "both"
      ? upNext(rounds, states)
      : view === "review"
        ? ((r) => (r ? { round: r, mode: "review" as const } : null))(nextReview(rounds, states))
        : ((r) => (r ? { round: r, mode: "quiz" as const } : null))(nextRound(rounds, states));
  const unseen = (round: Round<C, Q>) => round.flashcards.filter((c) => itemOf(progress?.flashcards, c._id)?.seenAt == null);
  const stepsOf = (round: Round<C, Q>, mode: "review" | "quiz"): NextStep["steps"] => {
    const s = states[round.n - 1];
    const fresh = unseen(round);
    return [
      ...(round.flashcards.length ? [mode === "review" ? { text: `Review · ${plural(fresh.length || round.flashcards.length, "flashcard")}`, state: "now" as const } : { text: "Review", state: "done" as const }] : []),
      ...(round.questions.length
        ? [mode === "quiz" || !s || !quizDone(s) ? { text: `Quiz · ${plural(round.questions.length, "question")}`, state: mode === "quiz" ? ("now" as const) : ("later" as const) } : { text: "Quiz", state: "done" as const }]
        : []),
    ];
  };

  const missedStep = (note: string): NextStep => ({ kind: "missed", icon: "focus", label: missedCards.length ? "Go over what you missed" : "Retry what you missed", note, action: goOver });
  const mixedStep = (note: string): NextStep => ({ kind: "mixed", icon: "layers", label: "Mixed quiz", note, action: { mode: "quiz", mix: true } });

  let next: NextStep | null;
  if (continued) {
    const which = continued.round === "mix" ? null : continued.round;
    next =
      continued.mode === "review"
        ? { kind: "continue", icon: "review", label: which ? `Continue review round ${which}` : "Continue your review", note: `Flashcard ${continued.index + 1} of ${continued.of}`, round: which ?? undefined, action: { mode: "review", ...(which ? { round: which } : {}) } }
        : { kind: "continue", icon: "quiz", label: which ? `Continue quiz round ${which}` : "Continue your quiz", note: `${continued.index} of ${continued.of} answered`, round: which ?? undefined, action: which ? { mode: "quiz", round: which } : { mode: "quiz", mix: true } };
  } else if (dueCards.length || dueQuestions.length) {
    next = {
      kind: "missed",
      icon: "focus",
      label: dueCards.length ? "Go over what you missed" : "Retry what you missed",
      note: `${count(dueCards.length, dueQuestions.length)} from before today`,
      // Just those (today's wait); the questions follow from the review's end.
      action: dueCards.length ? { mode: "reviewMissed", ids: dueCards } : { mode: "retryMissed", ids: dueQuestions },
    };
  } else if (path && view === "both") {
    next = { kind: "round", icon: path.mode, label: `Round ${path.round.n}`, note: "", steps: stepsOf(path.round, path.mode), round: path.round.n, action: { mode: path.mode, round: path.round.n } };
  } else if (path?.mode === "review") {
    const fresh = unseen(path.round);
    const cards = fresh.length ? fresh : path.round.flashcards;
    next = { kind: "round", icon: "review", label: `Review round ${path.round.n}`, note: `${plural(cards.length, "flashcard")}, about ${cards.reduce((n, c) => n + loadOf(c), 0)} recall points`, round: path.round.n, action: { mode: "review", round: path.round.n } };
  } else if (path) {
    next = { kind: "round", icon: "quiz", label: `Quiz round ${path.round.n}`, note: plural(path.round.questions.length, "quiz question"), round: path.round.n, action: { mode: "quiz", round: path.round.n } };
  } else if (!rounds.length) {
    next = null;
  } else if (misses) {
    next = missedStep(`Every round is done. Missed: ${missedNote}`);
  } else if (mixOpen) {
    next = mixedStep("Every round is done. Keep it all fresh");
  } else if (withReview) {
    next = { kind: "again", icon: "review", label: "Review again", note: "Every round is done. From round 1", round: 1, action: { mode: "review", round: 1 } };
  } else {
    next = { kind: "again", icon: "quiz", label: "Play round 1 again", note: "Three stars everywhere. A mixed quiz opens once a day has passed", round: 1, action: { mode: "quiz", round: 1 } };
  }

  const others = [
    ...(misses && next?.kind !== "missed" ? [missedStep(missedNote)] : []),
    ...(mixOpen && next?.kind !== "mixed" ? [mixedStep("Questions you've got right before, from every round")] : []),
  ].slice(0, 2);
  const current = (continued && continued.round !== "mix" ? continued.round : null) ?? path?.round.n ?? null;
  return { view, next, current, currentTag: next?.kind === "round" || next?.kind === "continue" ? "Up next" : "Next round", others };
}
