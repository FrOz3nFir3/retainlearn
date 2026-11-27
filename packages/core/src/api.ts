// What the new study endpoints accept and return, shared with the client so both sides agree on every field
// (PLAN 14.15). What they accept is a Zod schema, which the server checks every request against; its type is inferred
// from it. What they return is a plain type: it comes from our own server, so nothing checks it while the app runs.
import { ObjectIdHex, SubjectName, TimeZone, z } from "./schemas.ts";
import { MAX_RECALL_POINTS } from "./answers.ts";
import { PathContent, StepId, TEST_OUT } from "./paths.ts";
import type { PathStep, PathVersion, PathVisibility, StepCheck, StepSet } from "./paths.ts";
import { CLASS_MODES } from "./timetable.ts";
import type { ClassMode, Period } from "./timetable.ts";
import type { SubjectStatus } from "./progress.ts";
import type { Day, FlashcardProgress, QuestionProgress } from "./types.ts";

// /api/study-sets/:id
export const SetParams = z.object({ id: ObjectIdHex });

// GET /api/campus?tz=Asia/Kolkata: the browser says where it is, so "today" is the player's day.
export const CampusQuery = z.object({ tz: TimeZone });

// PUT /api/study-sets/:id/order: your own order of a set's flashcards (each one's quiz questions move with it, so the
// rounds follow it), or null for the author's. Kept with your progress in the set; flashcards added later go at the end.
export const STUDY_SET_ORDER_MAX = 5000;
export const StudySetOrder = z.object({
  order: z
    .array(ObjectIdHex)
    .max(STUDY_SET_ORDER_MAX)
    .refine((ids) => new Set(ids).size === ids.length, "Name each flashcard once.")
    .nullable(),
});
export type StudySetOrderBody = z.input<typeof StudySetOrder>;

// PATCH /api/campus/settings?tz=…: some of your settings, the ones sent: what the classroom shows of each round (its
// review and its quiz, or one of them), and the colour scheme (as your device has it, or light or dark).
export const STUDY_VIEWS = ["both", "review", "quiz"] as const;
export type StudyView = (typeof STUDY_VIEWS)[number];
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
// view3d: the campus in 3D (true), as the 2D map (false), or as the device suits (null: 2D without WebGL or with
// reduced motion).
// sky: the campus sky as your time has it ("auto"), or always one part of the day.
export const SKIES = ["auto", "morning", "afternoon", "evening", "night"] as const;
export type Sky = (typeof SKIES)[number];
export const SettingsPatch = z.object({
  studyView: z.enum(STUDY_VIEWS).optional(),
  theme: z.enum(THEMES).optional(),
  view3d: z.boolean().nullable().optional(),
  sky: z.enum(SKIES).optional(),
});
export type SettingsPatchBody = z.input<typeof SettingsPatch>;

// PATCH /api/campus/coach?tz=…: what the coach has told you, kept so it isn't told twice. heard: the day and the line
// you were told ("2026-11-27|period:0:…"); quiet: a day you said "Later" (no walking up again that day); toured: the
// first-visit tour was given.
export const CoachPatch = z.object({
  heard: z.string().min(1).max(160).optional(),
  quiet: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toured: z.literal(true).optional(),
});
export type CoachPatchBody = z.input<typeof CoachPatch>;

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
// wrongAnswers the others offered with it. version changes whenever the content does. author and updatedBy: their
// public names (null when the account is gone); reviewers: how many review its changes (who they are is for them).
export type PersonShown = { username: string; name: string };
export type StudySetContent = {
  _id: string;
  category: string;
  topic: string;
  subtopic: string;
  description: string;
  listed: boolean;
  version: number;
  author: PersonShown | null;
  updatedBy: PersonShown | null;
  createdAt: string | null;
  updatedAt: string | null;
  reviewers: number;
  flashcards: { _id: string; question: string; answer: string }[];
  questions: { _id: string; question: string; answer: string; wrongAnswers: string[]; flashcardId: string | null }[];
};

// A class left halfway, so it can carry on (from progress.classInProgress).
export type ClassInProgress = { key: string; mode: ClassMode; day: Day; seq: number; ids?: string[]; index?: number };

// GET /api/study-sets/:id/progress: your progress in the set, maps keyed by item id. Empty for a set you haven't started.
// reviewer: whether you review the set's changes (its author does), so the classroom can say what your edits do.
export type ProgressView = {
  setId: string;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  order: string[] | null;
  quiz: { started: number; finished: number };
  classInProgress: ClassInProgress | null;
  lastAt: string | null;
  reviewer?: boolean;
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

// POST /api/card/:id/report: "Report this set" (P0-14), with a reason and an optional note. The old endpoint's name
// until the editing API (P1-11). The reasons are the ones the reports collection keeps (studySetReports.mongo.js).
export const REPORT_REASONS = ["spam", "offensive", "wrong", "other"] as const;
export const REPORT_NOTE_MAX = 500;
export const StudySetReport = z.object({
  reason: z.enum(REPORT_REASONS, { error: "Choose a reason." }),
  note: z.string().trim().max(REPORT_NOTE_MAX, `Keep the note to ${REPORT_NOTE_MAX} characters.`).default(""),
});
export type StudySetReportBody = z.input<typeof StudySetReport>;

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
  sets: number; // its listed study sets: the size of its building on the 3D campus
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
    // A class left halfway, with what the coach says of it: its set's subtopic, and how far it got (index of of).
    classLeft: { setId: string; key: string; day: Day; mode?: ClassMode; category?: string | null; subtopic?: string | null; index?: number; of?: number } | null;
    // Back after days without a class: how many, and the streak that ended meanwhile (0: none ended, or a freeze kept
    // it). null when your last class was today or yesterday.
    away: { days: number; endedStreak: number } | null;
  };
  subjects: CampusSubject[];
  timetable: (Period & { set: { topic: string; subtopic: string; category: string } | null })[];
  fading: { category: string; count: number }[];
  today: { xp: number; answers: number };
};

// ---------- Paths (P2-07): /api/paths ----------

// Someone named on a path: its author, an editor, someone who suggested a change.
export type PathPerson = { _id: string; username: string; name: string };

// GET /api/paths?search=…&subject=…&mine=1&page=…: listed public paths, 12 a page, the most recently changed first.
// search: those with a word in their title that starts with it, in any case (as subjects); subject: one subject's.
// mine=1 (signed in): the paths you can edit instead, public or private, listed or not. A page past the last has none.
export const PATHS_PER_PAGE = 12;
export const PathsQuery = z.object({
  search: z.string().trim().max(100).default(""),
  subject: SubjectName.optional(),
  mine: z.literal("1").optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type PathListing = {
  _id: string;
  title: string;
  category: string;
  description: string;
  steps: number;
  exam: boolean;
  visibility: PathVisibility;
  listed: boolean;
  author: PathPerson | null;
  updatedAt: string;
};
export type PathsPage = { paths: PathListing[]; total: number; page: number; pages: number };

// GET /api/paths/:id: a path, for everyone when it's public (listed or not: a link still opens it), for its editors
// when it's private, and for nobody once deleted (404 for both). Each step comes with its study set (null: deleted)
// and whether it can be studied (checkStep). version: when the path last changed, sent back with an edit or a
// suggestion, so one made against an older version is refused rather than undoing what came since. you (signed in):
// whether you can edit it (and delete it: its author), whether you follow it, the steps you tested out of, your
// progress in its steps' sets, your suggestion (open, or decided and still kept) and its skill, if it's yours.
export const PathParams = z.object({ id: ObjectIdHex });
export type PathStepView = PathStep & { set: StepSet | null; check: StepCheck };
export type PathStepProgress = { flashcards: Record<string, FlashcardProgress>; questions: Record<string, QuestionProgress>; lastAt: string | null };
export type PathView = Omit<PathVersion, "steps"> & {
  _id: string;
  steps: PathStepView[];
  author: PathPerson | null;
  editors: PathPerson[];
  copiedFrom: string | null;
  listed: boolean;
  version: string;
  you: {
    canEdit: boolean;
    isAuthor: boolean;
    following: boolean;
    testedOut: string[];
    progress: Record<string, PathStepProgress>;
    suggestion: PathSuggestion | null;
    skill: { at: string } | null;
  } | null;
};

// POST /api/paths  PathContent: a new path, yours, answered with its id (201). As with study sets (P0-14), a new
// account makes fewer a day, and its public paths are unlisted (out of the lists, open by link) for its first days.
export type NewPath = { _id: string };

// PUT /api/paths/:id  { path, version }: the path saved by one of its editors, if it's still the version they started
// from (409 otherwise). Every step's set must be in the path's subject with something in it; picked flashcards no
// longer in their set are dropped. Who can see it is its author's call. Answers with the path as GET does.
export const PathEdit = z.object({ path: PathContent, version: z.iso.datetime() });

// DELETE /api/paths/:id: taken down by its author. Hidden from everyone, its history kept; whoever follows it finds
// it gone, and a skill earned on it keeps its title.
// POST /api/paths/:id/copy: a private copy, yours, titled "… (copy)" (201, its id). Its steps and their ids come too.
// PUT /api/paths/:id/follow?tz=… (CampusQuery): the path you follow (one at a time), its subject put on your campus
// if it isn't there. DELETE /api/paths/:id/follow: no longer.

// POST /api/paths/:id/editors  { username }: an editor added, by one of its editors (as a set's reviewers are).
// DELETE /api/paths/:id/editors/:userId: one taken off, never its author. Both answer with the editors.
export const PathEditorAdd = z.object({ username: Username });
export const PathEditorParams = z.object({ id: ObjectIdHex, userId: ObjectIdHex });

// Suggestions: someone signed in who can't edit a path can suggest a change, one at a time per path (sending another
// replaces it: PUT …/suggestions/mine, DELETE to withdraw it). Its editors accept it, which applies its own changes to
// the path as it is now (mergeSuggestion), or decline it with a note. Each lasts 15 days, then goes; until then its
// suggester sees what happened to it. Who can see the path isn't something a suggestion can change.
// GET /api/paths/:id/suggestions: the open ones, for its editors; yours, for anyone else.
// POST /api/paths/:id/suggestions/:suggestionId/accept, and …/decline  { note }.
export const PATH_SUGGESTION_DAYS = 15;
export const PathSuggest = z.object({ path: PathContent, version: z.iso.datetime() });
export const PathSuggestionParams = z.object({ id: ObjectIdHex, suggestionId: ObjectIdHex });
export const PATH_NOTE_MAX = 500;
export const PathDecline = z.object({ note: z.string().trim().max(PATH_NOTE_MAX, `Keep the note to ${PATH_NOTE_MAX} characters.`).default("") });
export type PathSuggestionStatus = "open" | "accepted" | "declined";
export type PathSuggestion = {
  _id: string;
  by: PathPerson | null;
  at: string;
  expiresAt: string;
  status: PathSuggestionStatus;
  summary: string[];
  note: string;
  after: PathVersion;
  stale: boolean; // the path changed since it was made: accepting applies only its own changes
};

// GET /api/paths/:id/history?page=…: what changed and who changed it, newest first, 20 a page (for whoever can see the
// path). from: whose suggestion it was, when an editor accepted one.
export const PATH_HISTORY_PER_PAGE = 20;
export const PathHistoryQuery = z.object({ page: z.coerce.number().int().min(1).max(10_000).default(1) });
export type PathHistoryKind = "created" | "edited" | "suggestion" | "deleted";
export type PathHistoryEntry = { _id: string; at: string; kind: PathHistoryKind; by: PathPerson | null; from: PathPerson | null; summary: string[] };
export type PathHistoryPage = { entries: PathHistoryEntry[]; page: number; pages: number };

// POST /api/paths/:id/steps/:stepId/test-out?tz=…  { answers }: a test out of a step, as the browser marked it (the
// answers themselves are saved as any class's are). Checked here (checkTestOut): when it passed, the step is done for
// you. Answers { passed }; 400 when they aren't the step's questions.
export const PathStepParams = z.object({ id: ObjectIdHex, stepId: StepId });
export const TestOut = z.object({ answers: z.array(z.object({ questionId: ObjectIdHex, right: z.boolean() })).min(1).max(TEST_OUT.questions) });
export type TestOutResult = { passed: boolean };

// POST /api/paths/:id/skill?tz=…: the path's skill, yours once every step is done (checked here, from your progress and
// test outs; 409 until then). Kept for good, with the path's title as it was.
export type PathSkill = { pathId: string; title: string; at: string };

// POST /api/paths/:id/report  { reason, note }: "Report this path", as a set is reported (StudySetReport): enough
// people reporting it take it out of the lists until it's checked.
