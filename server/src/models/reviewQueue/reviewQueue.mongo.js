import { Schema, model } from "mongoose";

// Suggested changes waiting for a study set's reviewers, one document per change, moved out of `cards.reviewQueue[]`.
// Items copied from today's queue keep their _id. An item expires a week after it's suggested: the TTL index deletes
// it by itself, which replaces the cleanup cron once nothing uses the old queue.
const reviewQueueItemSchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    changeType: { type: String, enum: ["edit", "addition", "deletion"], required: true },
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    oldDisplayText: { type: Schema.Types.Mixed },
    newDisplayText: { type: Schema.Types.Mixed },
    targetId: { type: String }, // flashcardId, quizId, optionId
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    metadata: { type: Schema.Types.Mixed },
  },
  { versionKey: false }
);

reviewQueueItemSchema.index({ setId: 1, submittedAt: -1 });
reviewQueueItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("ReviewQueueItem", reviewQueueItemSchema, "review_queue");
