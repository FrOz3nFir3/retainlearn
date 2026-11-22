// Every answer, logged as it's saved (PLAN 14.3b): a time series, never edited and never read while answering a
// request. A flashcard reviewed is one "flashcard" answer (known or not) plus one "point" answer per recall point.
import { Types } from "mongoose";
import Answer from "#models/answers/answers.mongo.js";
import { knewFlashcard } from "@retainlearn/core";
import type { SaveAnswers } from "@retainlearn/core";

export async function logAnswers(userId: string, setId: string, answers: SaveAnswers["answers"], at: Date): Promise<void> {
  const meta = { userId: new Types.ObjectId(userId), setId: new Types.ObjectId(setId) };
  const docs = answers.flatMap((answer) => {
    const item = new Types.ObjectId(answer.itemId);
    if (answer.kind === "question") return [{ at, meta, item, kind: "question", correct: answer.correct, ms: answer.ms, source: "class" }];
    return [
      { at, meta, item, kind: "flashcard", correct: knewFlashcard(answer.points, answer.knew), ms: answer.ms, source: "class" },
      ...answer.points.map((point) => ({ at, meta, item, kind: "point", point: point.key, correct: point.knew, source: "class" })),
    ];
  });
  await Answer.insertMany(docs, { ordered: false });
}
