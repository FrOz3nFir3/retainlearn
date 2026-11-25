// What the new study endpoints accept and return, shared with the client so both sides agree on every field
// (PLAN 14.15). What they accept is a Zod schema, which the server checks every request against; its type is inferred
// from it. What they return is a plain type: it comes from our own server, so nothing checks it while the app runs.
import { ObjectIdHex, SubjectName, TimeZone, z } from "./schemas.ts";
import { MAX_RECALL_POINTS } from "./answers.ts";
import { CLASS_MODES } from "./timetable.ts";
import type { ClassMode, Period } from "./timetable.ts";
import type { SubjectStatus } from "./progress.ts";
import type { Day, FlashcardProgress, QuestionProgress } from "./types.ts";

// /api/study-sets/:id
export const SetParams = z.object({ id: ObjectIdHex });

// GET /api/campus?tz=Asia/Kolkata: the browser says where it is, so "today" is the player's day.
export const CampusQuery = z.object({ tz: TimeZone });

const ms = z.number().int().min(0).max(3_600_000); // how long it took to answer, up to an hour
// A recall point's key comes from the answer's text (its section and first words), under 150 characters.
const RecallPoint = z.object({ key: z.string().min(1).max(160), knew: z.boolean() });
export const ClassAnswer = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("question"), itemId: ObjectIdHex, correct: z.boolean(), ms }),
  z.object({ kind: z.literal("flashcard"), itemId: ObjectIdHex, knew: z.boolean(), points: z.array(RecallPoint).max(MAX_RECALL_POINTS).default([]), ms }),
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

// DELETE /api/study-sets/:id/progress/quiz?tz=…: the set's quizzes afresh, from the report card. What you missed, your
// record of answers (right and wrong) and the quizzes counted are cleared; your player cards and flashcards stay. It
// returns your progress in the set (ProgressView), as it is now.
export const ResetQuizQuery = CampusQuery;

// GET /api/report-card?tz=…: your progress in every set you've started (its copied titles and counts, so no set is
// read), and your player's totals, for the report card. The browser's time zone decides the streak's "today".
export const ReportCardQuery = CampusQuery;
export type ReportCardSet = {
  setId: string;
  category: string;
  topic: string;
  subtopic: string;
  flashcardCount: number;
  questionCount: number;
  flashcards: Record<string, Pick<FlashcardProgress, "seenAt" | "missedOn">>; // without the recall-point marks, which it doesn't read
  questions: Record<string, QuestionProgress>;
  quiz: { started: number; finished: number };
  lastAt: string | null;
};
export type ReportCard = { xp: number; level: number; streak: { count: number; freezes: number }; subjects: number; sets: ReportCardSet[] };

// GET /api/subjects?search=…&page=…: every subject with a listed study set, 12 a page, the most recently updated
// first. search finds the subjects with a word in their name that starts with it, in any case ("dev" finds "Web
// Development"). A page past the last has no subjects. Public, like the subjects' pages.
export const SUBJECTS_PER_PAGE = 12;
export const SubjectsQuery = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type SubjectListing = { name: string; sets: number; flashcards: number; questions: number; updatedAt: string | null };
export type SubjectsPage = { subjects: SubjectListing[]; total: number; page: number; pages: number };

// GET /api/subjects/:name: a subject's listed study sets with their counts, in the order they were added (its
// building's floors). name comes back as it's kept (SubjectName). A subject with no sets yet (made a moment ago, or
// never) has none: its page invites the first.
export const SubjectParams = z.object({ name: SubjectName });
export type SubjectSet = { _id: string; topic: string; subtopic: string; flashcards: number; questions: number };
export type Subject = { name: string; sets: SubjectSet[] };

// POST /api/cards: a new study set in a subject, from the subject's page. The old endpoint, with its old field names,
// until the editor's own endpoints replace it (P1-11); it answers with the new set, its _id among the rest.
export const STUDY_SET_TOPIC_MAX = 60;
export const STUDY_SET_SUBTOPIC_MAX = 120;
export const NewStudySet = z.object({
  mainTopic: z.string().trim().min(1, "Give the set a topic.").max(STUDY_SET_TOPIC_MAX, `Keep the topic to ${STUDY_SET_TOPIC_MAX} characters.`),
  subTopic: z.string().trim().min(1, "Say which part of the topic it covers.").max(STUDY_SET_SUBTOPIC_MAX, `Keep it to ${STUDY_SET_SUBTOPIC_MAX} characters.`),
  category: SubjectName,
});
export type NewStudySetBody = z.input<typeof NewStudySet>;

// Signing in and signing up (POST /api/user/login and /api/user/register: the account's endpoints keep their names
// until they're renamed together), and your profile's details (PATCH /api/user). The forms check with these, the same
// rules the server applies: a username of 3 to 30 letters, numbers and underscores, a name up to 100 characters, and a
// password of at least 10 characters with an uppercase and a lowercase letter, a number and one of ! @ # $ % ^ & *.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_HINT = "At least 10 characters, with an uppercase and a lowercase letter, a number and one of ! @ # $ % ^ & *.";
export const AccountName = z.string().trim().min(1, "Enter your name.").max(100, "Keep your name to 100 characters.");
export const Username = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(30, "Keep it to 30 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers and underscores only.");
export const Email = z.string().trim().regex(EMAIL, "Enter an email address like name@example.com.");
export const NewPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[!@#$%^&*]/, "Add one of ! @ # $ % ^ & *.");
export const SignInBody = z.object({
  loginIdentifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});
export const SignUpBody = z
  .object({ name: AccountName, username: Username, email: Email, password: NewPassword, confirmPassword: z.string() })
  .refine((body) => body.password === body.confirmPassword, { message: "The two passwords don't match.", path: ["confirmPassword"] });
export const ProfileDetails = z.object({ name: AccountName, username: Username, email: Email });

// POST /api/campus/subjects?tz=…: a subject's building on your campus, on the first free plot, before you study it
// (a class in a subject puts it there too). It gives back the name as it's kept. DELETE /api/campus/subjects/:name
// takes one away again, while you haven't started it; your progress in it would stay either way.
export const AddSubject = z.object({ name: SubjectName });
export type AddedSubject = { name: string };

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
    streak: { count: number; freezes: number; keptToday: boolean }; // keptToday: a class finished today already
    unlocks: string[];
    classLeft: { setId: string; key: string; day: Day } | null;
  };
  subjects: CampusSubject[];
  timetable: (Period & { set: { topic: string; subtopic: string; category: string } | null })[];
  fading: { category: string; count: number }[];
  today: { xp: number; answers: number };
};
