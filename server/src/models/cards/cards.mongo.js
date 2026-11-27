import { Schema, model } from "mongoose";

const changeSchema = new Schema(
  {
    field: { type: String, required: true },
    // Store truncated plain text preview (max 200 chars) for context
    preview: { type: String, maxlength: 200 },
    // Optional: store which specific item was changed
    targetId: { type: String }, // flashcardId, quizId, optionId
  },
  { _id: false }
);

const logEntrySchema = new Schema({
  eventType: {
    type: String,
    required: true,
    enum: ["created", "updated", "deleted"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  summary: {
    type: String,
    required: true,
  },
  changes: [changeSchema],
});

const optionSchema = new Schema({
  value: { type: String, required: true },
});

const quizSchema = new Schema({
  quizQuestion: { type: String, required: true },
  quizAnswer: { type: String, required: true },
  options: { type: [optionSchema], default: [] },
  minimumOptions: { type: Number, default: 2 },
  flashcardId: { type: Schema.Types.ObjectId, required: false },
});

const reviewQueueItemSchema = new Schema({
  changeType: {
    type: String,
    enum: ["edit", "addition", "deletion"],
    required: true,
  },
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  oldDisplayText: { type: Schema.Types.Mixed },
  newDisplayText: { type: Schema.Types.Mixed },
  targetId: { type: String }, // flashcardId, quizId, optionId
  submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  metadata: { type: Schema.Types.Mixed }, // Additional context data
});

const reviewSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const cardsSchema = new Schema(
  {
    "main-topic": {
      type: String,
      required: true,
    },
    "sub-topic": {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    review: {
      type: [reviewSchema],
      default: [],
    },
    quizzes: {
      type: [quizSchema],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewers: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: function () { return [this.author]; }
    },
    reviewQueue: {
      type: [reviewQueueItemSchema],
      default: []
    },
    logs: [logEntrySchema],
    // Whether the set appears in the categories, the category pages and the sitemap, and can be indexed by search
    // engines (P0-14). Missing means listed: every set from before this field is. A new account's sets start with
    // `listed: false` and `listAt`, the day they're listed by themselves. Sets unlisted after reports have no
    // `listAt`: they stay unlisted until listed by hand. Reads use `listedFilter` (cards.model.js).
    listed: {
      type: Boolean,
    },
    listAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Study sets. The code still calls them "cards" (the model, the routes, cards.model.js); the collection was renamed
// from `cards` to `study_sets` (migrations/0002-study-set-names.js), so the database says what they are. Raw queries
// name it through `Card.collection.name`, never as a string.
export default model("Card", cardsSchema, "study_sets");
