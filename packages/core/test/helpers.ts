// Made-up study sets, progress and moments for the tests.

export const IST = "Asia/Kolkata";

// Noon in India on a day.
export const noon = (day: string): Date => new Date(`${day}T06:30:00Z`);

// A study set with its content: flashcards "<id>-f1", "<id>-f2"… and questions "<id>-q1"…, each question linked to a
// flashcard in turn.
export function makeSet(id: string, category: string, flashcards: number, questions: number) {
  return {
    _id: id,
    category,
    flashcards: Array.from({ length: flashcards }, (_, i) => ({ _id: `${id}-f${i + 1}` })),
    questions: Array.from({ length: questions }, (_, i) =>
      flashcards ? { _id: `${id}-q${i + 1}`, flashcardId: `${id}-f${(i % flashcards) + 1}` } : { _id: `${id}-q${i + 1}` },
    ),
  };
}
type MadeSet = ReturnType<typeof makeSet>;

// The same set as counted in progress.setInfo and the category list.
export const counted = (set: MadeSet) => ({ _id: set._id, category: set.category, flashcards: set.flashcards.length, questions: set.questions.length });

// A flashcard reviewed on the 15th, and missed on a day, or not.
export const seen = (missedOn: string | null = null) => ({ seenAt: noon("2026-11-15"), missedOn, points: [] });

// The set's first n flashcards reviewed, each missed on a day, or not.
export const reviewedFirst = (set: MadeSet, n: number, missedOn: string | null = null) =>
  Object.fromEntries(set.flashcards.slice(0, n).map((f) => [f._id, seen(missedOn)]));

// The set's first n questions held as player cards at a level, last remembered on a day.
export const cardsFirst = (set: MadeSet, n: number, level: number, day: string) =>
  Object.fromEntries(set.questions.slice(0, n).map((q) => [q._id, { level, refreshedAt: noon(day), right: 1, wrong: 0, missedOn: null }]));
