// Your progress in study sets (PLAN 14.3b): read when a classroom opens, and saved a few answers at a time while you
// study (PLAN 14.10).
import { Types } from "mongoose";
import Card from "#models/cards/cards.mongo.js";
import Progress from "#models/progress/progress.mongo.ts";
import type { ProgressDoc } from "#models/progress/progress.mongo.ts";
import { applyAnswers, dayKey } from "@retainlearn/core";
import type { ClassInProgress, ClassMode, FlashcardProgress, ProgressView, QuestionProgress, ReportCardSet, SaveAnswers } from "@retainlearn/core";
import type { StudySetOutline } from "#models/studySets/studySets.model.ts";

const oid = (id: string) => new Types.ObjectId(id);
const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

// The classes that are quizzes: the ones counted in progress.quiz, and cleared by resetQuiz.
const QUIZ_MODES: readonly ClassMode[] = ["quiz", "retryMissed"];

// Your progress in one set, or an empty one for a set you haven't started, and whether you review its changes (asked
// at the same time).
export async function progressView(userId: string, setId: string): Promise<ProgressView> {
  const [p, reviewer] = await Promise.all([Progress.findOne({ userId: oid(userId), setId: oid(setId) }).lean<ProgressDoc>(), reviews(userId, setId)]);
  return { ...viewOf(setId, p), reviewer };
}
const reviews = async (userId: string, setId: string): Promise<boolean> => (await Card.exists({ _id: oid(setId), reviewers: oid(userId) })) !== null;

function viewOf(setId: string, p: ProgressDoc | null): ProgressView {
  return {
    setId,
    flashcards: p?.flashcards ?? {},
    questions: p?.questions ?? {},
    order: p?.order ? p.order.map(String) : null,
    quiz: { started: p?.quiz?.started ?? 0, finished: p?.quiz?.finished ?? 0 },
    classInProgress: (p?.classInProgress as ClassInProgress | null | undefined) ?? null,
    lastAt: p?.lastAt ? new Date(p.lastAt).toISOString() : null,
  };
}

// Your own order of a set's flashcards, or null for the author's (PUT /api/study-sets/:id/order). Kept with your
// progress in the set, which is made if you haven't started it: it stays not started, with no details of the set, so
// the report card and the campus (which read the sets you've studied) leave it out.
export async function setOrder(userId: string, setId: string, order: string[] | null): Promise<void> {
  const filter = { userId: oid(userId), setId: oid(setId) };
  if (order) await Progress.updateOne(filter, { $set: { order: order.map(oid) } }, { upsert: true });
  else await Progress.updateOne(filter, { $unset: { order: 1 } });
}

// A set's quizzes afresh (the report card's quiz report): what you missed, your record of answers (right and wrong) and
// the quizzes counted are cleared, while your player cards (each one's level and when you last remembered it) and your
// flashcards stay. A quiz left halfway is dropped, since its answers so far are gone. One update the database works
// out, with no read first, so it can't undo a class saving at the same moment: that save sees updatedAt changed, and
// reads again. null when you haven't started the set.
export async function resetQuiz(userId: string, setId: string): Promise<{ view: ProgressView; category: string | null } | null> {
  const playerCards = { $filter: { input: { $objectToArray: { $ifNull: ["$questions", {}] } }, cond: { $gte: ["$$this.v.level", 1] } } };
  const [p, reviewer] = await Promise.all([
    Progress.findOneAndUpdate(
      { userId: oid(userId), setId: oid(setId) },
      [
        {
          $set: {
            questions: { $arrayToObject: { $map: { input: playerCards, in: { k: "$$this.k", v: { level: "$$this.v.level", refreshedAt: "$$this.v.refreshedAt" } } } } },
            quiz: { started: 0, finished: 0 },
            classInProgress: { $cond: [{ $in: ["$classInProgress.mode", QUIZ_MODES] }, null, "$classInProgress"] },
          },
        },
      ],
      { new: true },
    ).lean<ProgressDoc>(),
    reviews(userId, setId),
  ]);
  return p ? { view: { ...viewOf(setId, p), reviewer }, category: p.setInfo?.category ?? null } : null;
}

// Your progress across sets, as the campus's rules read it (in one subject, or all of it): one indexed query.
export type SetInfo = { category?: string | null; topic?: string | null; subtopic?: string | null; flashcards?: number | null; questions?: number | null; version?: number | null };
export type ProgressForRules = {
  setId: string;
  setInfo: SetInfo;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  lastAt: Date | null;
};

// Your progress in every set you've started, as the report card shows it: its copied titles and counts (so no set is
// read), what you've seen and answered, and the quizzes you've taken. Matched on the userId + setId index, then
// reshaped by the database: each flashcard comes as when you saw it and when you missed it, without its recall-point
// marks (up to 30 each), which the report card doesn't read and which would be most of the bytes.
type ReportCardRow = Pick<ProgressDoc, "setId" | "setInfo" | "questions" | "quiz" | "lastAt"> & { flashcards: ReportCardSet["flashcards"] };
export async function reportCardSets(userId: string): Promise<ReportCardSet[]> {
  const docs = await Progress.aggregate<ReportCardRow>([
    // Sets you've studied: they carry the set's details (a progress made only to keep your order doesn't).
    { $match: { userId: oid(userId), "setInfo.category": { $exists: true } } },
    {
      $project: {
        setId: 1,
        setInfo: 1,
        questions: 1,
        quiz: 1,
        lastAt: 1,
        flashcards: {
          $arrayToObject: {
            $map: { input: { $objectToArray: { $ifNull: ["$flashcards", {}] } }, in: { k: "$$this.k", v: { seenAt: "$$this.v.seenAt", missedOn: "$$this.v.missedOn" } } },
          },
        },
      },
    },
  ]);
  return docs.map((p) => ({
    setId: String(p.setId),
    category: p.setInfo?.category ?? "",
    topic: p.setInfo?.topic ?? "",
    subtopic: p.setInfo?.subtopic ?? "",
    flashcardCount: p.setInfo?.flashcards ?? 0,
    questionCount: p.setInfo?.questions ?? 0,
    flashcards: p.flashcards ?? {},
    questions: p.questions ?? {},
    quiz: { started: p.quiz?.started ?? 0, finished: p.quiz?.finished ?? 0 },
    lastAt: p.lastAt ? new Date(p.lastAt).toISOString() : null,
  }));
}

export async function allProgressOf(userId: string, category?: string): Promise<ProgressForRules[]> {
  const filter = { userId: oid(userId), ...(category ? { "setInfo.category": category } : {}) };
  const docs = await Progress.find(filter, { setId: 1, setInfo: 1, flashcards: 1, questions: 1, lastAt: 1 }).lean<ProgressDoc[]>();
  return docs.map((p) => ({
    setId: String(p.setId),
    setInfo: p.setInfo ?? {},
    flashcards: p.flashcards ?? {},
    questions: p.questions ?? {},
    lastAt: p.lastAt ?? null,
  }));
}

export type SavedBatch = {
  saved: boolean;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  earned: number;
  xp: number;
  // The first batch saved for its sitting of a class, whatever its number: the class has just started.
  firstOfSitting: boolean;
};
const NOT_SAVED: SavedBatch = { saved: false, flashcards: {}, questions: {}, earned: 0, xp: 0, firstOfSitting: false };

// How many recent sittings, and batch numbers in each, are kept to catch a batch sent twice. A class is a few dozen
// batches at most, and one sitting rarely overlaps more than another (a second tab or device).
const SITTINGS_KEPT = 3;
const SEQS_KEPT = 200;

// Saves a batch of a class's answers: applies them with the shared rules, then writes only the items they changed, in
// one update.
// - Saved once: a batch whose number was already saved for its sitting changes nothing, whatever order the batches
//   arrive in, and even after the class is finished. A batch that arrives late still counts, but only the newest batch
//   says where the class stands (classInProgress), and none once its last batch has come.
// - Never overwritten: the write only goes through if the document is still as it was read (its updatedAt), and the
//   first save for a set only creates the document, so two saves at the same moment can't undo each other: the later
//   one reads again and retries.
export async function saveAnswers(userId: string, set: StudySetOutline, batch: SaveAnswers, at: Date): Promise<SavedBatch> {
  const filter = { userId: oid(userId), setId: oid(set._id) };
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = await Progress.findOne(filter).lean<ProgressDoc>();
    const sittings = p?.sittings ?? [];
    const sitting = sittings.find((s) => s.key === batch.classKey);
    if (sitting?.seqs.includes(batch.seq)) return NOT_SAVED;

    const change = applyAnswers(p, set, batch.answers, { at, timeZone: batch.timeZone });
    const newest = !sitting || batch.seq > Math.max(...sitting.seqs);
    const done = Boolean(sitting?.done) || batch.finished;
    const thisSitting = { key: batch.classKey, seqs: [...(sitting?.seqs ?? []), batch.seq].slice(-SEQS_KEPT), done };
    const $set: Record<string, unknown> = {
      sittings: [...sittings.filter((s) => s !== sitting), thisSitting].slice(-SITTINGS_KEPT),
      lastAt: at,
      setInfo: { category: set.category, topic: set.topic, subtopic: set.subtopic, flashcards: set.flashcards.length, questions: set.questions.length, version: set.version },
    };
    const resumable = p?.classInProgress as ClassInProgress | null | undefined;
    if (batch.finished) {
      if (!resumable || resumable.key === batch.classKey) $set.classInProgress = null; // another sitting's stays
    } else if (newest && !done) {
      $set.classInProgress = { key: batch.classKey, mode: batch.mode, day: dayKey(at, batch.timeZone), seq: batch.seq, ...(batch.resume ?? {}) };
    }
    for (const [id, item] of Object.entries(change.flashcards)) $set[`flashcards.${id}`] = item;
    for (const [id, item] of Object.entries(change.questions)) $set[`questions.${id}`] = item;
    // How many quizzes you've started and finished, as today's app counts them.
    const quiz = QUIZ_MODES.includes(batch.mode);
    const $inc: Record<string, number> = {};
    if (quiz && batch.seq === 1) $inc["quiz.started"] = 1;
    if (quiz && batch.finished) $inc["quiz.finished"] = 1;
    const update = { $set, ...(Object.keys($inc).length ? { $inc } : {}) };

    try {
      if (p) {
        const unchanged = p.updatedAt ? { updatedAt: p.updatedAt } : { updatedAt: { $exists: false } };
        const result = await Progress.updateOne({ _id: p._id, ...unchanged }, update);
        if (result.matchedCount === 0) continue; // changed since it was read
      } else {
        // Creates the document, and only that: if another save made it meanwhile, this filter can't match it, the
        // insert fails on the unique index, and the loop reads it and starts again.
        await Progress.updateOne({ ...filter, createdAt: { $exists: false } }, update, { upsert: true, setDefaultsOnInsert: false });
      }
      return { saved: true, ...change, firstOfSitting: !sitting };
    } catch (error) {
      if (isDuplicateKey(error)) continue; // made by another save at the same moment
      throw error;
    }
  }
  throw new Error("Progress for this set is being saved from elsewhere at the same moment");
}
