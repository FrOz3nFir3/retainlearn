import { Schema, model } from "mongoose";

// One per account and study set: where you stand with each flashcard and question, your own round order, and the
// class in progress (so it resumes on another device). Read when a classroom or class opens, and by the report card;
// written every few answers. It copies the set's category, titles and counts, so reading it never joins `cards`
// (PLAN 14.3b). Flashcards and questions are maps keyed by their id, so a batch of answers can `$set` just the items
// it touched. Recall-point keys are free text (they can hold dots), so they're stored as values, never as field names.

const pointSchema = new Schema({ key: { type: String, required: true }, knew: { type: Boolean, required: true }, at: { type: Date } }, { _id: false });

const flashcardSchema = new Schema(
  {
    seenAt: { type: Date },
    missedOn: { type: String, default: null }, // the day it was last missed, until you get it
    points: { type: [pointSchema], default: undefined },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    level: { type: Number, min: 0, max: 5, default: 0 }, // 1 to 5: a player card; fading once past its interval
    lastAt: { type: Date },
    right: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    missedOn: { type: String, default: null },
    opponent: { type: new Schema({ asked: Number, lastAt: Date, right: Number }, { _id: false }), default: undefined },
  },
  { _id: false }
);

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    // Copied from the set (`set` itself would hide Mongoose's document.set()).
    setInfo: {
      category: String,
      topic: String,
      subtopic: String,
      flashcards: Number,
      questions: Number,
      version: Number,
    },
    flashcards: { type: Map, of: flashcardSchema, default: {} },
    questions: { type: Map, of: questionSchema, default: {} },
    reviewedUpTo: { type: Number, default: 0 }, // today's app's "first N flashcards" counter, from the copy
    order: { type: [Schema.Types.ObjectId], default: undefined }, // your own round order (none: the author's)
    quiz: { started: { type: Number, default: 0 }, finished: { type: Number, default: 0 } },
    // { key, mode, day, ids, index, seq, ... }: seq lets a batch of answers sent twice be applied once.
    classInProgress: { type: Schema.Types.Mixed, default: null },
    lastAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

progressSchema.index({ userId: 1, setId: 1 }, { unique: true });
progressSchema.index({ userId: 1, lastAt: -1 });

export default model("Progress", progressSchema, "progress");
