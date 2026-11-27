// The why behind a quiz question: its linked flashcard, else the closest one as a guess, else none. Each test is a rule
// written as an example. (Splitting an answer into its parts needs a browser: prototype/e2e app-round-2.mjs checks it.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { closestFlashcards, terms, whySource } from "./why.ts";

const flashcards = [
  { _id: "f1", question: "<p>What does <code>const</code> declare?</p>", answer: "<p>A block-scoped binding that can't be reassigned.</p>" },
  { _id: "f2", question: "<p>What does the event loop do?</p>", answer: "<p>It runs queued callbacks once the call stack is empty.</p>" },
  { _id: "f3", question: "<p>How does <code>Array.prototype.reduce</code> work?</p>", answer: "<p>It folds an array into one value with an accumulator.</p>" },
];
const question = (over: object) => ({ question: "", answer: "", wrongAnswers: [] as string[], ...over });

test("words and identifiers: camelCase parts, plurals folded, common words left out", () => {
  assert.deepEqual(terms("getPrototypeOf returns the callbacks"), ["getprototypeof", "get", "prototype", "return", "callback"]);
});

test("a linked question's why is its flashcard", () => {
  const source = whySource(question({ question: "<p>Anything</p>", flashcardId: "f2" }), flashcards);
  assert.equal(source?.index, 1);
  assert.equal(source?.guess, false);
});

test("an unlinked question gets the closest flashcard, as a guess", () => {
  const q = question({ question: "<p>When does the event loop run queued callbacks?</p>", answer: "<p>When the call stack is empty</p>" });
  assert.equal(closestFlashcards(q, flashcards)[0]?.index, 1);
  const source = whySource(q, flashcards);
  assert.equal(source?.flashcard._id, "f2");
  assert.equal(source?.guess, true);
});

test("nothing close: no why", () => {
  assert.equal(whySource(question({ question: "<p>Which planet has rings?</p>", answer: "<p>Saturn</p>" }), flashcards), null);
});

test("a short answer is shown whole", () => {
  const source = whySource(question({ flashcardId: "f1" }), flashcards);
  assert.equal(source?.passage.partial, false);
  assert.equal(source?.passage.html, flashcards[0]?.answer);
});
