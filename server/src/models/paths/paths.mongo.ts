import { Schema, model } from "mongoose";
import type { InferSchemaType, Types } from "mongoose";
import { PATH_VISIBILITIES } from "@retainlearn/core";
import type { Lean } from "#models/lean.ts";

// Paths (P2-07): an ordered list of steps in one subject that adds up to a skill (core's paths.ts has the rules). Its
// author and editors change it; anyone signed in can follow it. Read for its page, the lists and your timetable;
// written when its editors save it. contentAt: when its content last changed, the version an edit or a suggestion is
// made against (a report or a new editor changes updatedAt, not it, so they never refuse an edit). As a study set's
// (P0-14), a new account's public path is unlisted (listed false, listAt when the account is trusted), and reports
// unlist one until it's listed by hand. deletedAt: taken down by its author; kept, as its history and the skills
// earned on it point at it, but shown to nobody. Its indexes are made by migration 0006 (autoIndex is off).

// A step: a study set, whole (no flashcardIds) or flashcards picked from it, under a name of its own ("": the set's).
// id: the step's own, made by the editor that added it (core's StepId).
const stepSchema = new Schema(
  {
    id: { type: String, required: true },
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    flashcardIds: { type: [Schema.Types.ObjectId], default: undefined },
    title: { type: String, default: "" },
  },
  { _id: false, id: false }
);

const pathSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    visibility: { type: String, enum: PATH_VISIBILITIES, default: "public" },
    exam: { type: Boolean, default: true },
    steps: { type: [stepSchema], default: [] },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editorIds: { type: [Schema.Types.ObjectId], default: [] },
    copiedFrom: { type: Schema.Types.ObjectId, default: null },
    contentAt: { type: Date, required: true },
    listed: { type: Boolean },
    listAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// A subject's paths, the most recently changed first; and the paths you write or edit.
pathSchema.index({ category: 1, contentAt: -1 });
pathSchema.index({ authorId: 1 });
pathSchema.index({ editorIds: 1 });

export type PathDoc = Lean<InferSchemaType<typeof pathSchema>> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

export default model("Path", pathSchema, "paths");
