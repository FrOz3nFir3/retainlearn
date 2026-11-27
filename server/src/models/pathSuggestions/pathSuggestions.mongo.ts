import { Schema, model } from "mongoose";
import type { InferSchemaType, Types } from "mongoose";
import type { Lean } from "#models/lean.ts";

// A change to a path suggested by someone who can't edit it (P2-07, decisions 4 and 12): one open per person per path
// (sending another replaces it), accepted or declined by its editors. before: the path as it was when it was made
// (version: its contentAt then), after: what it proposes, summary: the change in plain words (core's pathChanges).
// Decided ones stay, with their status and note, so their suggester sees what happened; every one goes 15 days after
// it was last sent (expiresAt, deleted by MongoDB). Its indexes are made by migration 0006.
const pathSuggestionSchema = new Schema(
  {
    pathId: { type: Schema.Types.ObjectId, ref: "Path", required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["open", "accepted", "declined"], default: "open" },
    version: { type: Date, required: true },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed, required: true },
    summary: { type: [String], default: [] },
    note: { type: String, default: "" },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { versionKey: false }
);

// A path's suggestions, newest first; yours on a path, while it's open (one at most); yours lately, for the daily cap.
pathSuggestionSchema.index({ pathId: 1, at: -1 });
pathSuggestionSchema.index({ pathId: 1, by: 1 }, { unique: true, partialFilterExpression: { status: "open" } });
pathSuggestionSchema.index({ by: 1, at: -1 });
pathSuggestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PathSuggestionDoc = Lean<InferSchemaType<typeof pathSuggestionSchema>> & { _id: Types.ObjectId };

export default model("PathSuggestion", pathSuggestionSchema, "path_suggestions");
