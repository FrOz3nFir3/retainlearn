// What the new study endpoints accept and return, shared with the client so both sides agree on every field
// (PLAN 14.15). What they accept is a Zod schema, which the server checks every request against; its type is inferred
// from it. What they return is a plain type: it comes from our own server, so nothing checks it while the app runs.
import { ObjectIdHex, TimeZone, z } from "./schemas.ts";
import { CLASS_MODES } from "./timetable.ts";
import type { ClassMode, Period } from "./timetable.ts";
import type { SubjectStatus } from "./progress.ts";
import type { Day, FlashcardProgress, QuestionProgress } from "./types.ts";

// /api/study-sets/:id
export const SetParams = z.object({ id: ObjectIdHex });

// GET /api/campus?tz=Asia/Kolkata: the browser says where it is, so "today" is the player's day.
export const CampusQuery = z.object({ tz: TimeZone });

const ms = z.number().int().min(0).max(3_600_000); // how long it took to answer, up to an hour
const RecallPoint = z.object({ key: z.string().min(1).max(300), knew: z.boolean() });
export const ClassAnswer = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("question"), itemId: ObjectIdHex, correct: z.boolean(), ms }),
  z.object({ kind: z.literal("flashcard"), itemId: ObjectIdHex, knew: z.boolean(), points: z.array(RecallPoint).max(60).default([]), ms }),
]);

// POST /api/study-sets/:id/answers: a class's answers, sent a few at a time as the class goes, so leaving halfway
// loses nothing. classKey names one sitting of a class, new each time a class starts (its kind, round and start time,
// say), and kept when it carries on. seq numbers that sitting's batches: a batch whose number was already saved
// changes nothing, so a batch sent twice (a retry, a flaky connection) counts once. resume is where the class stands,
// so it can carry on from another device. finished marks the class's last batch.
export const SaveAnswers = z.object({
  timeZone: TimeZone,
  classKey: z.string().min(1).max(120),
  mode: z.enum(CLASS_MODES),
  seq: z.number().int().min(1).max(100_000),
  answers: z.array(ClassAnswer).min(1).max(25),
  resume: z.object({ ids: z.array(ObjectIdHex).max(200), index: z.number().int().min(0).max(200) }).optional(),
  finished: z.boolean().default(false),
});
export type SaveAnswers = z.infer<typeof SaveAnswers>;
// What the client sends: the same, before the defaults are filled in (finished, and a flashcard's points, may be left out).
export type SaveAnswersBody = z.input<typeof SaveAnswers>;

// GET /api/study-sets/:id: a study set's content, in the new names. answer is the right answer to a question, and
// wrongAnswers the others offered with it. version changes whenever the content does.
export type StudySetContent = {
  _id: string;
  category: string;
  topic: string;
  subtopic: string;
  description: string;
  listed: boolean;
  version: number;
  flashcards: { _id: string; question: string; answer: string }[];
  questions: { _id: string; question: string; answer: string; wrongAnswers: string[]; flashcardId: string | null }[];
};

// A class left halfway, so it can carry on (from progress.classInProgress).
export type ClassInProgress = { key: string; mode: ClassMode; day: Day; seq: number; ids?: string[]; index?: number };

// GET /api/study-sets/:id/progress: your progress in the set, maps keyed by item id. Empty for a set you haven't started.
export type ProgressView = {
  setId: string;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  order: string[] | null;
  quiz: { started: number; finished: number };
  classInProgress: ClassInProgress | null;
  lastAt: string | null;
};

// What saving a batch of answers gives back. saved: false when the batch had been saved already (nothing changed).
// flashcards and questions: the items the batch changed, as they are now. earned: player cards earned. xp: what the
// batch earned (with the timetable's bonus, on the class that completes it). finished: for a class's last batch.
export type SavedAnswers = {
  saved: boolean;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  earned: number;
  xp: number;
  finished?: { streak: number; firstToday: boolean; timetableDone: boolean };
};

// GET /api/campus: everything the campus shows, in one call.
export type CampusSubject = {
  category: string;
  plot: number;
  started: number;
  mastery: number;
  missed: number;
  lastAt: string | null;
  status: SubjectStatus;
};
export type Campus = {
  day: Day;
  player: {
    settings: { view3d: boolean | null; look: string; sky: string; theme: string; studyView: string; extraTime: boolean; timeZone: string };
    coach: { heard: string | null; quiet: string | null; toured: boolean };
    xp: number;
    level: number;
    streak: { count: number; freezes: number };
    unlocks: string[];
    classLeft: { setId: string; key: string; day: Day } | null;
  };
  subjects: CampusSubject[];
  timetable: (Period & { set: { topic: string; subtopic: string; category: string } | null })[];
  fading: { category: string; count: number }[];
  today: { xp: number; answers: number };
};
