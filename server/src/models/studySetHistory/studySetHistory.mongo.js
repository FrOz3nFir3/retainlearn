import { Schema, model } from "mongoose";

// A study set's edit history, one document per edit, moved out of the set's own `logs[]` so the set stops growing
// with every edit. Insert-only, read a page at a time, newest first. Entries copied from today's logs keep their _id
// and come in as `v: 1`, as they were: their `changes` vary in shape, so they're kept as they are. New entries are
// `v: 2`: one per save, with before and after per change (PLAN 14.14). `by` and `at`: who edited, and when.
const studySetHistorySchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    at: { type: Date, required: true },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    kind: { type: String, enum: ["created", "updated", "deleted"], required: true },
    summary: { type: String, required: true },
    changes: { type: [Schema.Types.Mixed], default: [] },
    v: { type: Number, default: 2 },
  },
  { versionKey: false }
);

studySetHistorySchema.index({ setId: 1, at: -1 });

export default model("StudySetHistory", studySetHistorySchema, "study_set_history");
