import { Schema, model } from "mongoose";

// A study set's edit history, one document per edit, moved out of `cards.logs[]` so a set's document stops growing
// with every edit. Entries copied from today's logs keep their _id and come in as `v: 1`, as they were (their
// `changes` vary in shape, so they're kept as they are). New entries are `v: 2`: one per save, with before and after
// per change (PLAN 14.14).
const cardLogSchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    at: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    eventType: { type: String, enum: ["created", "updated", "deleted"], required: true },
    summary: { type: String, required: true },
    changes: { type: [Schema.Types.Mixed], default: [] },
    v: { type: Number, default: 2 },
  },
  { versionKey: false }
);

cardLogSchema.index({ setId: 1, at: -1 });

export default model("CardLog", cardLogSchema, "card_logs");
