// What a quiz asks (the prototype's QuizClass buildQuestions), in a shuffled order:
// - a round: the questions on a few flashcards in a row (packages/core rounds), the next one by default, or ?round=n;
// - mixed (?mix=1): up to 5 questions you already hold, from across the set (mixedQuestions);
// - your pick (?ids=…): the questions you chose in the classroom;
// - a retry (the retryMissed class): up to 8 of the questions you've missed, or those of them you picked.
// Plain functions with the shuffle passed in, so they're tested without a browser (quizPlan.test.ts).
import { mixedQuestions, nextRound, roundState, setRounds } from "@retainlearn/core";
import type { ProgressView, StudySetContent, When } from "@retainlearn/core";

export type QuizQuestion = StudySetContent["questions"][number];
export type QuizPlan = { title: string | null; questions: QuizQuestion[]; round: number | null };
export type QuizChoice = { round?: number | null; mix?: boolean; picked?: ReadonlySet<string> | null };
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
    const missed = set.questions.filter((q) => progress?.questions[q._id]?.missedOn != null && (!choice.picked || choice.picked.has(q._id)));
    return { title: "Retry", questions: shuffled(missed, random).slice(0, RETRY_MAX), round: null };
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
