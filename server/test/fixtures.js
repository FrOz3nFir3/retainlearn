// Made-up data for the tests and `npm run db:seed`: an author, a learner, and two study sets with flashcards and a
// linked question. Nothing real. Fixed ids, so tests can point at them.
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

export const PASSWORD = "local-test-password";

export const ids = {
  author: new ObjectId("000000000000000000000a01"),
  learner: new ObjectId("000000000000000000000a02"),
  js: new ObjectId("000000000000000000000b01"),
  bio: new ObjectId("000000000000000000000b02"),
  constCard: new ObjectId("000000000000000000000c01"),
  loopCard: new ObjectId("000000000000000000000c02"),
  cellCard: new ObjectId("000000000000000000000c03"),
};

// Passwords are plain here: the User model hashes them when saved (User.create).
export const users = () => [
  { _id: ids.author, name: "Ada Author", username: "ada_author", email: "ada@example.test", password: PASSWORD },
  { _id: ids.learner, name: "Lee Learner", username: "lee_learner", email: "lee@example.test", password: PASSWORD },
];

export const cards = () => [
  {
    _id: ids.js,
    "main-topic": "JavaScript",
    "sub-topic": "Fundamentals",
    category: "Programming",
    description: "Variables, scope and the event loop.",
    author: ids.author,
    reviewers: [ids.author],
    review: [
      { _id: ids.constCard, question: "<p>What does <code>const</code> declare?</p>", answer: "<p>A block-scoped binding that can't be reassigned.</p>" },
      { _id: ids.loopCard, question: "<p>What does the event loop do?</p>", answer: "<p>Runs queued callbacks once the call stack is empty.</p>" },
    ],
    // History and a suggestion waiting for review, so reads that show who did what return people.
    logs: [
      { eventType: "created", user: ids.author, summary: "Created the study set", timestamp: new Date("2026-01-01"), changes: [] },
      {
        eventType: "updated",
        user: ids.author,
        summary: "Edited a flashcard",
        timestamp: new Date("2026-01-02"),
        changes: [{ field: "Flashcard Answer", oldValue: "<p>Old</p>", newValue: "<p>New</p>", cardId: ids.loopCard }],
      },
    ],
    reviewQueue: [
      {
        changeType: "edit",
        field: "description",
        oldValue: "Variables, scope and the event loop.",
        newValue: "Variables, scope, closures and the event loop.",
        targetId: ids.js,
        submittedBy: ids.learner,
        submittedAt: new Date("2026-01-03"),
        expiresAt: new Date("2099-01-01"),
      },
    ],
    // `options` are the wrong answers; the right one is `quizAnswer` (as in the real model).
    quizzes: [
      {
        quizQuestion: "<p>Can a <code>const</code> binding be reassigned?</p>",
        quizAnswer: "No",
        options: [{ value: "Yes" }, { value: "Only inside a loop" }, { value: "Only inside a function" }],
        minimumOptions: 2,
        flashcardId: ids.constCard,
      },
    ],
  },
  {
    _id: ids.bio,
    "main-topic": "Cells",
    "sub-topic": "Basics",
    category: "Biology",
    author: ids.author,
    reviewers: [ids.author],
    review: [{ _id: ids.cellCard, question: "<p>Which organelle makes most of a cell's energy?</p>", answer: "<p>The mitochondrion.</p>" }],
    quizzes: [],
  },
];
