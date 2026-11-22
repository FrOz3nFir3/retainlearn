// Your progress in study sets (PLAN 14.3b): read when a classroom opens, and saved a few answers at a time while you
// study (PLAN 14.10).
import { Types } from "mongoose";
import Progress from "#models/progress/progress.mongo.js";
import { applyAnswers, dayKey } from "@retainlearn/core";
import type { ClassInProgress, FlashcardProgress, ProgressView, QuestionProgress, SaveAnswers } from "@retainlearn/core";
import type { StudySetOutline } from "#models/studySets/studySets.model.ts";

type SetInfo = { category?: string; topic?: string; subtopic?: string; flashcards?: number; questions?: number; version?: number };
type StoredProgress = {
  _id: Types.ObjectId;
  setId: Types.ObjectId;
  setInfo?: SetInfo;
  flashcards?: Record<string, FlashcardProgress>;
  questions?: Record<string, QuestionProgress>;
  order?: Types.ObjectId[] | null;
  quiz?: { started?: number; finished?: number };
  classInProgress?: ClassInProgress | null;
  lastBatch?: { key: string; seq: number };
  lastAt?: Date | null;
  updatedAt?: Date;
};

const oid = (id: string) => new Types.ObjectId(id);
const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

// Your progress in one set, or an empty one for a set you haven't started.
export async function progressView(userId: string, setId: string): Promise<ProgressView> {
  const p = await Progress.findOne({ userId: oid(userId), setId: oid(setId) }).lean<StoredProgress>();
  return {
    setId,
    flashcards: p?.flashcards ?? {},
    questions: p?.questions ?? {},
    order: p?.order ? p.order.map(String) : null,
    quiz: { started: p?.quiz?.started ?? 0, finished: p?.quiz?.finished ?? 0 },
    classInProgress: p?.classInProgress ?? null,
    lastAt: p?.lastAt ? new Date(p.lastAt).toISOString() : null,
  };
}

// Your progress across sets, as the campus's rules read it (in one subject, or all of it): one indexed query.
export type ProgressForRules = {
  setId: string;
  setInfo: SetInfo;
  flashcards: Record<string, FlashcardProgress>;
  questions: Record<string, QuestionProgress>;
  lastAt: Date | null;
};

export async function allProgressOf(userId: string, category?: string): Promise<ProgressForRules[]> {
  const filter = { userId: oid(userId), ...(category ? { "setInfo.category": category } : {}) };
  const docs = await Progress.find(filter, { setId: 1, setInfo: 1, flashcards: 1, questions: 1, lastAt: 1 }).lean<StoredProgress[]>();
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
};

// Saves a batch of a class's answers: applies them with the shared rules, then writes only the items they changed, in
// one update. It's safe to send twice: a batch numbered no higher than the last one saved for the same sitting of a
// class (lastBatch) changes nothing, even the class's last batch. And the write only goes through if the document is
// still as it was read (its updatedAt), so two saves at the same moment can't overwrite each other: the later one
// reads again and retries.
export async function saveAnswers(userId: string, set: StudySetOutline, batch: SaveAnswers, at: Date): Promise<SavedBatch> {
  const filter = { userId: oid(userId), setId: oid(set._id) };
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = await Progress.findOne(filter).lean<StoredProgress>();
    const last = p?.lastBatch;
    if (last && last.key === batch.classKey && last.seq >= batch.seq) return { saved: false, flashcards: {}, questions: {}, earned: 0, xp: 0 };

    const change = applyAnswers(p, set, batch.answers, { at, timeZone: batch.timeZone });
    const $set: Record<string, unknown> = {
      lastBatch: { key: batch.classKey, seq: batch.seq },
      lastAt: at,
      setInfo: { category: set.category, topic: set.topic, subtopic: set.subtopic, flashcards: set.flashcards.length, questions: set.questions.length, version: set.version },
      classInProgress: batch.finished
        ? null
        : { key: batch.classKey, mode: batch.mode, day: dayKey(at, batch.timeZone), seq: batch.seq, ...(batch.resume ?? {}) },
    };
    for (const [id, item] of Object.entries(change.flashcards)) $set[`flashcards.${id}`] = item;
    for (const [id, item] of Object.entries(change.questions)) $set[`questions.${id}`] = item;
    // How many quizzes you've started and finished, as today's app counts them.
    const quiz = batch.mode === "quiz" || batch.mode === "retryMissed";
    const $inc: Record<string, number> = {};
    if (quiz && batch.seq === 1) $inc["quiz.started"] = 1;
    if (quiz && batch.finished) $inc["quiz.finished"] = 1;
    const update = { $set, ...(Object.keys($inc).length ? { $inc } : {}) };

    try {
      if (p) {
        const result = await Progress.updateOne({ _id: p._id, updatedAt: p.updatedAt }, update);
        if (result.matchedCount === 0) continue; // changed since it was read
      } else {
        await Progress.updateOne(filter, update, { upsert: true, setDefaultsOnInsert: false });
      }
      return { saved: true, ...change };
    } catch (error) {
      if (isDuplicateKey(error)) continue; // made by another save at the same moment
      throw error;
    }
  }
  throw new Error("Progress for this set is being saved from elsewhere at the same moment");
}
