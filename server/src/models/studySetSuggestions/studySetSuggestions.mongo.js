import { Schema, model } from "mongoose";

// Suggested changes to a study set, waiting for its reviewers: one document per suggestion, holding its changes, each
// accepted or declined on its own (PLAN 14.14). Moved out of the set's own `reviewQueue[]`; each of today's queue
// items comes across as a suggestion with one change. One open suggestion per person per set comes with the editing
// API (P1-11). A suggestion expires a week after it's made: the TTL index deletes it, which replaces the cleanup cron
// once the old queue is gone. `by` and `at`: who suggested it, and when.
const changeSchema = new Schema({
  kind: { type: String, enum: ["edit", "addition", "deletion"], required: true },
  field: { type: String, required: true },
  targetId: { type: String }, // the flashcard, question or option it's about
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  beforeText: { type: Schema.Types.Mixed },
  afterText: { type: Schema.Types.Mixed },
  status: { type: String, enum: ["open", "accepted", "declined"], default: "open" },
});

const studySetSuggestionSchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    status: { type: String, enum: ["open", "accepted", "declined", "partly", "withdrawn"], default: "open" },
    note: { type: String },
    changes: { type: [changeSchema], default: [] },
  },
  { versionKey: false }
);

studySetSuggestionSchema.index({ setId: 1, at: -1 });
studySetSuggestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("StudySetSuggestion", studySetSuggestionSchema, "study_set_suggestions");
