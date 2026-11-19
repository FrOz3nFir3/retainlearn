import { Schema, model } from "mongoose";
import { genSalt, hash } from "bcrypt";

const quizAttemptSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    answerAttempts: {
      type: Number,
      default: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
    },
    timesIncorrect: {
      type: Number,
      default: 0,
    },
    struggling: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    lastReviewedCardNo: {
      type: Number,
      default: 0,
    },
    weakCards: [
      {
        flashcardId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        reviewCount: {
          type: Number,
          default: 1,
        },
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const quizSchema = new Schema(
  {
    timesStarted: {
      type: Number,
      default: 0,
    },
    timesFinished: {
      type: Number,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    totalIncorrect: {
      type: Number,
      default: 0,
    },
    attempts: [quizAttemptSchema],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false, timestamps: true }
);

const studyingSchema = new Schema(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
    },
    review: {
      type: reviewSchema,
      default: {},
    },
    quiz: {
      type: quizSchema,
      default: {},
    },
  },
  { _id: false }
);

const UsersSchema = new Schema({
  name: {
    type: String,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  // Unique, like the username: one account per email.
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  // Unique among the accounts that have one (the index below).
  googleId: {
    type: String,
  },
  // Moves on when every session should end (logging out, or a Google sign-in with the account's email). Sign-in
  // tokens carry the version they were issued with (routes/user/auth.controller.js). Missing on older accounts,
  // which counts as 0.
  tokenVersion: {
    type: Number,
    default: 0,
  },
  studying: [studyingSchema],
});

// The indexes declared here are made by a migration (src/migrations/0001-indexes.js), not when the server starts. A
// test checks that the two agree.
UsersSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $exists: true } } });

const SALT_WORK_FACTOR = 10;

UsersSchema.pre("save", async function save(next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await genSalt(SALT_WORK_FACTOR);
    this.password = await hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

export default model("User", UsersSchema);
