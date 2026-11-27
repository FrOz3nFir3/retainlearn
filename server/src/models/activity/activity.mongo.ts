import { Schema, model } from "mongoose";
import type { InferSchemaType, Types } from "mongoose";
import type { Lean } from "#models/lean.ts";

// One per account and day (the player's local day). Today's is read on every campus load (PLAN 14.3b). The work that
// depends on the date rather than on a write happens once, at the day's first load, and is kept here: the timetable
// (so it doesn't reshuffle) and how many player cards are fading in each subject. Then what was done.

const periodSchema = new Schema(
  {
    kind: { type: String, enum: ["class", "match"], required: true },
    setId: { type: Schema.Types.ObjectId },
    mode: { type: String },
    arena: { type: String },
    why: { type: Schema.Types.Mixed }, // why it's on today's timetable: { kind, n, of?, title? } (packages/core, planDay)
    step: { type: String }, // a path's step of picked flashcards ("pathId.stepId"), which its class keeps to
    set: { type: Schema.Types.Mixed }, // the set's { topic, subtopic, category }, copied, so the campus needs no lookup
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    timetable: { type: [periodSchema], default: [] },
    doneAt: { type: Date }, // when the last period was done: the timetable's bonus XP is given once, then
    fading: { type: [new Schema({ category: String, count: Number }, { _id: false })], default: [] },
    xp: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
    daily: { type: [new Schema({ arena: String, result: Schema.Types.Mixed }, { _id: false })], default: [] }, // the daily penalties
  },
  { timestamps: true, versionKey: false }
);

activitySchema.index({ userId: 1, day: -1 }, { unique: true });

export type ActivityDoc = Lean<InferSchemaType<typeof activitySchema>> & { _id: Types.ObjectId };

export default model("Activity", activitySchema, "activity");
