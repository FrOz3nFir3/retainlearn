import { Schema, model } from "mongoose";

// One per account and day (the player's local day). Today's is read on every campus load (PLAN 14.3b). The work that
// depends on the date rather than on a write happens once, at the day's first load, and is kept here: the timetable
// (so it doesn't reshuffle) and how many cards are fading in each subject. Then what was done.

const periodSchema = new Schema(
  {
    kind: { type: String, enum: ["class", "match"], required: true },
    setId: { type: Schema.Types.ObjectId },
    mode: { type: String },
    arena: { type: String },
    why: { type: String },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    timetable: { type: [periodSchema], default: [] },
    fading: { type: [new Schema({ category: String, count: Number }, { _id: false })], default: [] },
    xp: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
    daily: { type: [new Schema({ arena: String, result: Schema.Types.Mixed }, { _id: false })], default: [] }, // the daily penalties
  },
  { timestamps: true, versionKey: false }
);

activitySchema.index({ userId: 1, day: -1 }, { unique: true });

export default model("Activity", activitySchema, "activity");
