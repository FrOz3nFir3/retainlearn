import { Schema, model } from "mongoose";
import type { InferSchemaType, Types } from "mongoose";
import type { Lean } from "#models/lean.ts";

// A path's history (P2-07): one entry per change, append-only, as a study set's is. kind: created, edited (by an
// editor), suggestion (someone's suggestion, accepted: by is the editor, from the suggester) or deleted. summary: the
// change in plain words (core's pathChanges). Kept when the path is deleted. Its index is made by migration 0006.
const pathHistorySchema = new Schema(
  {
    pathId: { type: Schema.Types.ObjectId, ref: "Path", required: true },
    at: { type: Date, required: true },
    kind: { type: String, enum: ["created", "edited", "suggestion", "deleted"], required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: { type: Schema.Types.ObjectId, ref: "User" },
    summary: { type: [String], default: [] },
  },
  { versionKey: false }
);

// A path's history, newest first, a page at a time.
pathHistorySchema.index({ pathId: 1, at: -1 });

export type PathHistoryDoc = Lean<InferSchemaType<typeof pathHistorySchema>> & { _id: Types.ObjectId };

export default model("PathHistory", pathHistorySchema, "path_history");
