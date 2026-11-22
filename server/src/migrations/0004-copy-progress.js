// Copies each account's study history out of `users.studying[]` into `progress`: one document per account and study
// set (P1-05, PLAN 14.3b). It only makes documents that aren't there yet, so it never overwrites what the new app has
// saved, and running it again changes nothing. `studying[]` itself is left as it is until you decide (D-15).
//
// How today's progress maps:
// - an entry for a study set that's been deleted is left out, and so are flashcards and questions deleted since;
// - review.lastReviewedCardNo: the old app counts the set's first N flashcards as reviewed, so those N get a seenAt
//   (review.updatedAt). The rules count "reviewed" from seenAt (packages/core);
// - review.weakCards: missedOn, the day it was marked (addedAt), and a seenAt if it hasn't one;
// - quiz.attempts: right and wrong. A question got right at least once and not marked struggling is a player card at
//   level 1, refreshed at quiz.updatedAt; one marked struggling was missed on the day of quiz.updatedAt;
// - quiz.timesStarted and timesFinished: quiz.started and finished;
// - lastAt: the later of review.updatedAt and quiz.updatedAt;
// - setInfo: the set's category, titles and counts, and its version (updatedAt, as a number).
// Days are UTC days, since the old app kept no time zone. copiedAt records when it was copied, so a later copy (just
// before the new study screens go live) can tell the documents the new app hasn't written to since.
// Not here: `players`. The new campus endpoint makes each account's on its first visit, working out the subjects with
// the study rules, which a migration mustn't use: it never changes once merged, and the rules will.
export const id = "0004-copy-progress";
export const description = "each account's study history copied out of users.studying into progress (the old data stays)";

const list = (value) => (Array.isArray(value) ? value : []);
const utcDay = (date) => new Date(date).toISOString().slice(0, 10);
const latest = (...dates) => dates.filter((d) => d != null).map((d) => new Date(d)).sort((a, b) => b - a)[0] ?? null;

// One account's progress in one study set, from its studying[] entry. set: the set's _id, category, titles, flashcard
// and question ids (in the set's order) and updatedAt. Returns the document, and how many of the entry's flashcards
// and questions are no longer in the set (left out). Exported, so a later copy can reuse it unchanged.
export function progressFrom(userId, entry, set, copiedAt) {
  const review = entry.review ?? {};
  const quiz = entry.quiz ?? {};
  const flashcardIds = list(set.review).map((card) => String(card._id));
  const inSet = { flashcards: new Set(flashcardIds), questions: new Set(list(set.quizzes).map((q) => String(q._id))) };
  const reviewedAt = review.updatedAt ?? quiz.updatedAt ?? copiedAt;
  const quizAt = quiz.updatedAt ?? copiedAt;
  let leftOut = 0;

  const flashcards = {};
  for (const id of flashcardIds.slice(0, Math.max(0, Number(review.lastReviewedCardNo) || 0))) {
    flashcards[id] = { seenAt: reviewedAt, missedOn: null };
  }
  for (const weak of list(review.weakCards)) {
    const id = String(weak?.flashcardId);
    if (!inSet.flashcards.has(id)) {
      leftOut++;
      continue;
    }
    const markedAt = weak.addedAt ?? reviewedAt;
    flashcards[id] = { seenAt: flashcards[id]?.seenAt ?? markedAt, missedOn: utcDay(markedAt) };
  }

  const questions = {};
  for (const attempt of list(quiz.attempts)) {
    const id = String(attempt?.quizId);
    if (!inSet.questions.has(id)) {
      leftOut++;
      continue;
    }
    const right = Number(attempt.timesCorrect) || 0;
    const card = right >= 1 && !attempt.struggling;
    questions[id] = {
      level: card ? 1 : 0,
      ...(card ? { refreshedAt: quizAt } : {}),
      right,
      wrong: Number(attempt.timesIncorrect) || 0,
      missedOn: attempt.struggling ? utcDay(quizAt) : null,
    };
  }

  const doc = {
    userId,
    setId: set._id,
    setInfo: {
      category: set.category,
      topic: set["main-topic"],
      subtopic: set["sub-topic"],
      flashcards: flashcardIds.length,
      questions: inSet.questions.size,
      version: set.updatedAt ? new Date(set.updatedAt).getTime() : null,
    },
    flashcards,
    questions,
    quiz: { started: Number(quiz.timesStarted) || 0, finished: Number(quiz.timesFinished) || 0 },
    lastAt: latest(review.updatedAt, quiz.updatedAt),
    copiedAt,
    createdAt: copiedAt,
    updatedAt: copiedAt,
  };
  return { doc, leftOut };
}

export async function up(db, { dryRun, log }) {
  const copiedAt = new Date();
  const accounts = await db.collection("users").find({ "studying.0": { $exists: true } }, { projection: { studying: 1 } }).toArray();
  const entries = accounts.flatMap((account) => list(account.studying).map((entry) => ({ userId: account._id, entry })));
  if (!entries.length) return log("progress: no study history to copy");

  // Every set the entries mention, and the progress already there for these accounts: two reads, whatever the size.
  const setIds = [...new Map(entries.filter(({ entry }) => entry?.cardId).map(({ entry }) => [String(entry.cardId), entry.cardId])).values()];
  const sets = new Map(
    (
      await db
        .collection("study_sets")
        .find({ _id: { $in: setIds } }, { projection: { category: 1, "main-topic": 1, "sub-topic": 1, "review._id": 1, "quizzes._id": 1, updatedAt: 1 } })
        .toArray()
    ).map((set) => [String(set._id), set]),
  );
  const there = new Set(
    (await db.collection("progress").find({ userId: { $in: accounts.map((a) => a._id) } }, { projection: { userId: 1, setId: 1 } }).toArray()).map(
      (p) => `${p.userId}:${p.setId}`,
    ),
  );

  const docs = [];
  let deletedSets = 0;
  let unreadable = 0;
  let alreadyThere = 0;
  let leftOut = 0;
  for (const { userId, entry } of entries) {
    if (!entry?.cardId) {
      unreadable++;
      continue;
    }
    const set = sets.get(String(entry.cardId));
    if (!set) {
      deletedSets++;
      continue;
    }
    const key = `${userId}:${set._id}`;
    if (there.has(key)) {
      alreadyThere++;
      continue;
    }
    there.add(key); // a second entry for the same set: the first one counts
    const copy = progressFrom(userId, entry, set, copiedAt);
    docs.push(copy.doc);
    leftOut += copy.leftOut;
  }

  if (dryRun) {
    log(`progress: ${docs.length} document(s) will be made, from ${accounts.length} account(s) with a study history`);
  } else {
    const ops = docs.map(({ userId, setId, ...rest }) => ({ updateOne: { filter: { userId, setId }, update: { $setOnInsert: rest }, upsert: true } }));
    const made = ops.length ? (await db.collection("progress").bulkWrite(ops, { ordered: false })).upsertedCount : 0;
    log(`progress: ${made} document(s) made, from ${accounts.length} account(s) with a study history`);
  }
  if (alreadyThere) log(`progress: ${alreadyThere} already there, kept as they are`);
  if (deletedSets) log(`progress: ${deletedSets} entr(y/ies) for study set(s) deleted since, left out`);
  if (leftOut) log(`progress: ${leftOut} flashcard(s) or question(s) deleted from their sets since, left out`);
  if (unreadable) log(`progress: ${unreadable} entr(y/ies) with no study set, left out`);
}
