// The new endpoints' view of study sets (PLAN 14.3b). The database keeps today's field names (main-topic, sub-topic,
// review, quizzes, quizQuestion, quizAnswer, options) until the old code that reads them is gone, so the new names
// (topic, subtopic, flashcards, questions, question, answer, wrongAnswers) are given here, in one place.
import { Types } from "mongoose";
import Card from "#models/cards/cards.mongo.js";
import { isListed, listedFilter } from "#models/cards/cards.model.js";
import { escapeRegex } from "#utils/textNormalization.js";
import { SUBJECTS_PER_PAGE } from "@retainlearn/core";
import type { StudySetContent, SubjectListing, SubjectSet } from "@retainlearn/core";

// A study set as the old model stores it. Written by hand: that model is today's JavaScript, which is replaced rather
// than converted (PLAN 14.15), so there's no schema type to infer this from.
type StoredSet = {
  _id: Types.ObjectId;
  category: string;
  "main-topic": string;
  "sub-topic": string;
  description?: string;
  listed?: boolean;
  listAt?: Date;
  updatedAt?: Date;
  review?: { _id: Types.ObjectId; question?: string; answer?: string }[];
  quizzes?: { _id: Types.ObjectId; quizQuestion?: string; quizAnswer?: string; options?: { value: string }[]; flashcardId?: Types.ObjectId | null }[];
};

const versionOf = (set: { updatedAt?: Date }) => (set.updatedAt ? new Date(set.updatedAt).getTime() : 0);

// A study set's content, for studying it. Null when there's no such set.
export async function studySetContent(id: string): Promise<StudySetContent | null> {
  const set = await Card.findById(id, { category: 1, "main-topic": 1, "sub-topic": 1, description: 1, listed: 1, listAt: 1, updatedAt: 1, review: 1, quizzes: 1 }).lean<StoredSet>();
  if (!set) return null;
  return {
    _id: String(set._id),
    category: set.category,
    topic: set["main-topic"],
    subtopic: set["sub-topic"],
    description: set.description ?? "",
    listed: isListed(set),
    version: versionOf(set),
    flashcards: (set.review ?? []).map((card) => ({ _id: String(card._id), question: card.question ?? "", answer: card.answer ?? "" })),
    questions: (set.quizzes ?? []).map((quiz) => ({
      _id: String(quiz._id),
      question: quiz.quizQuestion ?? "",
      answer: quiz.quizAnswer ?? "",
      wrongAnswers: (quiz.options ?? []).map((option) => option.value),
      flashcardId: quiz.flashcardId ? String(quiz.flashcardId) : null,
    })),
  };
}

// A study set as the rules need it to apply answers: its category and titles, and its items' ids and links.
export type StudySetOutline = {
  _id: string;
  category: string;
  topic: string;
  subtopic: string;
  version: number;
  flashcards: { _id: string }[];
  questions: { _id: string; flashcardId: string | null }[];
};

export async function studySetOutline(id: string): Promise<StudySetOutline | null> {
  const set = await Card.findById(id, {
    category: 1,
    "main-topic": 1,
    "sub-topic": 1,
    updatedAt: 1,
    "review._id": 1,
    "quizzes._id": 1,
    "quizzes.flashcardId": 1,
  }).lean<StoredSet>();
  if (!set) return null;
  return {
    _id: String(set._id),
    category: set.category,
    topic: set["main-topic"],
    subtopic: set["sub-topic"],
    version: versionOf(set),
    flashcards: (set.review ?? []).map((card) => ({ _id: String(card._id) })),
    questions: (set.quizzes ?? []).map((quiz) => ({ _id: String(quiz._id), flashcardId: quiz.flashcardId ? String(quiz.flashcardId) : null })),
  };
}

export const studySetExists = async (id: string): Promise<boolean> => (await Card.exists({ _id: id })) !== null;

// Study sets with their counts, as the timetable and the campus's subjects take them: the listed ones in some
// categories (as the category pages show them), plus any given by id (the sets you've studied, listed or not). In a
// stable order, category then id, since the timetable's ties go to the first.
export type CountedSet = { _id: string; category: string; topic: string; subtopic: string; flashcards: number; questions: number };

export async function countedSets(categories: readonly string[], setIds: readonly string[]): Promise<CountedSet[]> {
  if (!categories.length && !setIds.length) return [];
  const rows: (StoredSet & { flashcards: number; questions: number })[] = await Card.aggregate([
    { $match: { $or: [{ category: { $in: categories }, ...listedFilter() }, { _id: { $in: setIds.map((id) => new Types.ObjectId(id)) } }] } },
    {
      $project: {
        category: 1,
        "main-topic": 1,
        "sub-topic": 1,
        flashcards: { $size: { $ifNull: ["$review", []] } },
        questions: { $size: { $ifNull: ["$quizzes", []] } },
      },
    },
    { $sort: { category: 1, _id: 1 } },
  ]);
  return rows.map((row) => ({
    _id: String(row._id),
    category: row.category,
    topic: row["main-topic"],
    subtopic: row["sub-topic"],
    flashcards: row.flashcards,
    questions: row.questions,
  }));
}

// A subject's listed study sets with their counts, in the order they were added (its building's floors).
export async function subjectSets(name: string): Promise<SubjectSet[]> {
  return (await countedSets([name], [])).map(({ _id, topic, subtopic, flashcards, questions }) => ({ _id, topic, subtopic, flashcards, questions }));
}

const sizeOf = (field: string) => ({ $size: { $ifNull: [field, []] } });

// The subjects with a listed study set, a page at a time, the most recently updated first (then by name, so a page
// holds still), each with its sets', flashcards' and questions' counts: the page and the total in one aggregation.
// search: the subjects with a word in their name that starts with it, in any case.
// lean-ctx: it reads every listed set (8 in production, 2026-11-25); index the category, or use a search index, when
// there are thousands (P1-12 checks the hot queries).
export async function subjectsPage(search: string, page: number, perPage = SUBJECTS_PER_PAGE): Promise<{ subjects: SubjectListing[]; total: number }> {
  const named = search ? { category: new RegExp(`(?:^|\\s)${escapeRegex(search)}`, "i") } : {};
  type Row = { _id: string; sets: number; flashcards: number; questions: number; updatedAt?: Date | null };
  const [result] = await Card.aggregate<{ page: Row[]; total: { n: number }[] }>([
    { $match: { ...named, ...listedFilter() } },
    { $group: { _id: "$category", sets: { $sum: 1 }, flashcards: { $sum: sizeOf("$review") }, questions: { $sum: sizeOf("$quizzes") }, updatedAt: { $max: "$updatedAt" } } },
    { $facet: { page: [{ $sort: { updatedAt: -1, _id: 1 } }, { $skip: (page - 1) * perPage }, { $limit: perPage }], total: [{ $count: "n" }] } },
  ]);
  return {
    subjects: (result?.page ?? []).map((row) => ({
      name: row._id,
      sets: row.sets,
      flashcards: row.flashcards,
      questions: row.questions,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    })),
    total: result?.total[0]?.n ?? 0,
  };
}
