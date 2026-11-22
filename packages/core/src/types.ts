// The shapes the rules read: a study set, and your progress in it, as the server stores them (PLAN 14.3b) and the API
// sends them. Written by hand, not inferred from Zod, because nothing checks them while the app runs: they come from
// our own database (PLAN 14.15).

// A moment: a Date from the database, or an ISO string or a timestamp from JSON.
export type DateLike = Date | string | number;

// A day where the player is, as "YYYY-MM-DD" (days.ts).
export type Day = string;

// Today where the player is. timeZone: an IANA name such as "Asia/Kolkata"; UTC when it's missing.
export type When = { today: Day; timeZone?: string };

// An id as the database has it (an ObjectId) or as JSON sends it (its hex string).
export type Id = string | { toString(): string };

// A question you've answered: progress.questions[id]. Level 1 or more makes it a player card.
export type QuestionProgress = {
  level?: number;
  refreshedAt?: DateLike | null; // when you last remembered it
  right?: number;
  wrong?: number;
  missedOn?: Day | null; // the day you last missed it, until you get it right
};

// A recall point you marked in a review.
export type RecallMark = { key: string; knew: boolean; at: DateLike };

// A flashcard you've reviewed: progress.flashcards[id].
export type FlashcardProgress = {
  seenAt?: DateLike | null;
  missedOn?: Day | null; // the day you last missed it, until you recall all of it
  points?: RecallMark[];
};

// A map keyed by item id: a plain object (read with lean(), or sent as JSON) or a Map (a Mongoose document).
export type ItemMap<T> = Record<string, T> | Map<string, T>;

// Your progress in a study set: the parts the rules read.
export type Progress = {
  flashcards?: ItemMap<FlashcardProgress>;
  questions?: ItemMap<QuestionProgress>;
  lastAt?: DateLike | null;
};

export type FlashcardItem = { _id: Id };
export type QuestionItem = { _id: Id; flashcardId?: Id | null };

// A study set, either with its content (in the set's order) or counted, as progress.setInfo and the category list
// have it ({ flashcards: 101, questions: 147 }).
export type StudySet = {
  _id: Id;
  category: string;
  flashcards: readonly FlashcardItem[] | number;
  questions: readonly QuestionItem[] | number;
};
