import { Schema, model } from "mongoose";

// Every answer, from the day the new screens go live: never edited, and never read while answering a request (later
// features read it: measured difficulty, ghosts, ratings). A time-series collection, made as one by
// migrations/0003-new-collections.js. A time series can't have unique indexes, so a batch sent twice is caught by
// progress.classInProgress.seq instead. A flashcard reviewed is one "flashcard" answer (known or not), plus one "point"
// answer for each recall point marked.
const answerSchema = new Schema(
  {
    at: { type: Date, required: true },
    meta: {
      userId: { type: Schema.Types.ObjectId, required: true },
      setId: { type: Schema.Types.ObjectId, required: true },
    },
    item: { type: Schema.Types.ObjectId, required: true }, // the question or flashcard
    kind: { type: String, enum: ["question", "flashcard", "point"], required: true },
    point: { type: String }, // the recall point's key, for kind "point"
    correct: { type: Boolean, required: true },
    ms: { type: Number },
    source: { type: String, enum: ["class", "battle", "daily", "training"], required: true },
  },
  { timeseries: { timeField: "at", metaField: "meta", granularity: "seconds" }, versionKey: false }
);

export default model("Answer", answerSchema, "answers");
