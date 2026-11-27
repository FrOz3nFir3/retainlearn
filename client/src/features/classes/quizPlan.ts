// What a quiz asks (the prototype's QuizClass buildQuestions), in a shuffled order:
// - a round: the questions on a few flashcards in a row (packages/core rounds), the next one by default, or ?round=n;
// - mixed (?mix=1): up to 5 questions you already hold, from across the set (mixedQuestions);
// - your pick (?ids=…): the questions you chose in the classroom;
// - a retry (the retryMissed class): up to 8 of the questions you've missed, or those of them you picked;
// - a path's step of picked flashcards (?step=, the prototype's): a round's worth of its questions, the ones you don't
//   hold yet first, then the ones held longest ago; or, testing out of a step (?testout=1), up to 10 of its questions,
//   one from each of its rounds first (core's testOutPick). A retry keeps to the step's questions.
// Plain functions with the shuffle passed in, so they're tested without a browser (quizPlan.test.ts).
import { ROUND, isPlayerCard, mixedQuestions, nextRound, roundState, setRounds, testOutPick } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";

export type QuizQuestion = StudySetContent["questions"][number];
export type QuizPlan = { title: string | null; questions: QuizQuestion[]; round: number | null };
// A path's step: its flashcards and questions (core's stepItems), and whether this is a test out of it.
export type StepChoice = { flashcards: ReadonlySet<string>; questions: ReadonlySet<string>; testOut: boolean };
export type QuizChoice = { round?: number | null; mix?: boolean; picked?: ReadonlySet<string> | null; step?: StepChoice | null };
export type AnswerOption = { html: string; correct: boolean };

const RETRY_MAX = 8;
export const MAX_OPTIONS = 4;

export function shuffled<T>(list: readonly T[], random: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function planQuiz(
  set: StudySetContent,
  progress: ProgressView | null | undefined,
  retry: boolean,
  when: When,
  choice: QuizChoice,
  loadOf: (flashcard: StudySetContent["flashcards"][number]) => number,
  random: () => number = Math.random,
): QuizPlan {
  if (retry) {
    const within = choice.step?.questions ?? choice.picked;
    const missed = set.questions.filter((q) => progress?.questions[q._id]?.missedOn != null && (!within || within.has(q._id)));
    return { title: "Retry", questions: shuffled(missed, random).slice(0, RETRY_MAX), round: null };
  }
  if (choice.step) {
    const step = choice.step;
    const questions = set.questions.filter((q) => step.questions.has(q._id));
    if (step.testOut) {
      const rounds = setRounds({ flashcards: set.flashcards.filter((f) => step.flashcards.has(f._id)), questions }, progress?.order, loadOf);
      return { title: "Skip test", questions: testOutPick(rounds, random), round: null };
    }
    const held = (q: QuizQuestion) => isPlayerCard(progress?.questions[q._id]);
    const refreshed = (q: QuizQuestion) => Date.parse(String(progress?.questions[q._id]?.refreshedAt ?? "")) || 0;
    const ahead = [...shuffled(questions.filter((q) => !held(q)), random), ...questions.filter(held).sort((a, b) => refreshed(a) - refreshed(b))];
    return { title: "Quiz", questions: shuffled(ahead.slice(0, ROUND), random), round: null };
  }
  if (choice.picked) return { title: "Your pick", questions: shuffled(set.questions.filter((q) => choice.picked?.has(q._id)), random), round: null };
  const rounds = setRounds(set, progress?.order, loadOf);
  if (choice.mix) return { title: "Mixed quiz", questions: shuffled(mixedQuestions(rounds, progress, when, undefined, random), random), round: null };
  const round = choice.round ? rounds[choice.round - 1] : nextRound(rounds, rounds.map((r) => roundState(r, progress, when)), true);
  if (!round) return { title: null, questions: [], round: null };
  return { title: `Round ${round.n} of ${rounds.length}`, questions: shuffled(round.questions, random), round: round.n };
}

// A question's options: its answer and up to three of its wrong answers, shuffled. The answer is always one of them.
export function answerOptions(question: QuizQuestion, random: () => number = Math.random): AnswerOption[] {
  const wrong = shuffled(question.wrongAnswers, random).slice(0, MAX_OPTIONS - 1);
  return shuffled([{ html: question.answer, correct: true }, ...wrong.map((html) => ({ html, correct: false }))], random);
}
