// The second copy of each account's study history out of `users.studying[]` into `progress` (P1-05, D-17). It runs as
// the new study screens go live, and brings over what's been studied in the old app since the first copy (0004), with
// 0004's progressFrom, unchanged, so both copies map the same way.
// - A set started in the old app since then: its document is made, as 0004 makes them.
// - A set 0004 copied, and the new app hasn't written to since (updatedAt is still copiedAt): its document is copied
//   again from the old data as it is now, if anything differs, and copiedAt moves on. The write only goes through if
//   the document is still as it was read, so a save by the new app in between wins.
// - A document the new app has written to (a class saved, a quiz reset): kept as it is. Before the release nothing but
//   the copy writes there, so this only guards the unexpected.
// `players`: none should be made yet (the campus that makes them goes live with this release). If some are, their
// subjects' summaries aren't touched here (the study rules make them, and a migration mustn't use the rules: see
// 0004); each refreshes with its next class in that subject. The run says how many there are.
import { progressFrom } from "./0004-copy-progress.js";

export const id = "0005-copy-progress-again";
export const description = "what's been studied in the old app since the first copy, copied into progress again";

const list = (value) => (Array.isArray(value) ? value : []);
// What a copy writes, comparable (dates as ISO strings, in progressFrom's order), to tell what's changed.
const copiedParts = (doc) => JSON.stringify([doc.setInfo, doc.flashcards, doc.questions, doc.quiz, doc.lastAt]);

export async function up(db, { dryRun, log }) {
  const copiedAt = new Date();
  const players = await db.collection("players").countDocuments();
  if (players) log(`players: ${players} made already; their subjects' summaries refresh with each one's next class`);
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
  const there = new Map(
    (
      await db
        .collection("progress")
        .find(
          { userId: { $in: accounts.map((a) => a._id) } },
          { projection: { userId: 1, setId: 1, setInfo: 1, flashcards: 1, questions: 1, quiz: 1, lastAt: 1, copiedAt: 1, updatedAt: 1 } },
        )
        .toArray()
    ).map((p) => [`${p.userId}:${p.setId}`, p]),
  );

  const make = [];
  const again = [];
  const done = new Set();
  let unchanged = 0;
  let kept = 0;
  let deletedSets = 0;
  let unreadable = 0;
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
    if (done.has(key)) continue; // a second entry for the same set: the first one counts, as in 0004
    done.add(key);
    const { doc } = progressFrom(userId, entry, set, copiedAt);
    const old = there.get(key);
    if (!old) make.push(doc);
    else if (!old.copiedAt || !old.updatedAt || +old.updatedAt !== +old.copiedAt) kept++;
    else if (copiedParts(old) === copiedParts(doc)) unchanged++;
    else again.push({ old, doc });
  }

  if (dryRun) {
    log(`progress: ${make.length} document(s) will be made and ${again.length} copied again (studied in the old app since), from ${accounts.length} account(s) with a study history`);
  } else {
    const ops = [
      ...make.map(({ userId, setId, ...rest }) => ({ updateOne: { filter: { userId, setId }, update: { $setOnInsert: rest }, upsert: true } })),
      ...again.map(({ old, doc: { userId, setId, createdAt, ...rest } }) => ({ updateOne: { filter: { _id: old._id, updatedAt: old.updatedAt }, update: { $set: rest } } })),
    ];
    const result = ops.length ? await db.collection("progress").bulkWrite(ops, { ordered: false }) : null;
    log(`progress: ${result?.upsertedCount ?? 0} document(s) made and ${result?.modifiedCount ?? 0} copied again, from ${accounts.length} account(s) with a study history`);
  }
  if (unchanged) log(`progress: ${unchanged} unchanged since they were copied`);
  if (kept) log(`progress: ${kept} written by the new app since, kept as they are`);
  if (deletedSets) log(`progress: ${deletedSets} entr(y/ies) for study set(s) deleted since, left out`);
  if (unreadable) log(`progress: ${unreadable} entr(y/ies) with no study set, left out`);
}
