// Study sets have been `cards` in the database since the app's first version, and their reports `card_reports`, which
// reads as if they were about flashcards. Every collection about study sets is now named for them: `study_sets`,
// `study_set_reports`, and the new `study_set_history` and `study_set_suggestions` (0003). Reports also get the field
// names every new collection uses: `setId` for the set, `by` and `at` for who reported it and when.
// It runs before 0003 so the rename happens within a moment of the server starting: the server's code already reads
// the new names, and renaming takes no time.
import { ensureIndex } from "./ensureIndex.js";
import { renameCollection } from "./renameCollection.js";

export const id = "0002-study-set-names";
export const description = "cards → study_sets and card_reports → study_set_reports, with setId, by and at in reports";

const OLD_FIELDS = { card: "setId", reporter: "by", createdAt: "at" };

export async function up(db, ctx) {
  const { dryRun, log } = ctx;
  await renameCollection(db, "cards", "study_sets", ctx);
  await renameCollection(db, "card_reports", "study_set_reports", ctx);

  // The reports' fields. In a dry run the rename above hasn't happened, so they're read where they are now.
  const exists = async (name) => (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
  const reports = db.collection(dryRun && !(await exists("study_set_reports")) ? "card_reports" : "study_set_reports");
  const oldNamed = await reports.countDocuments({ card: { $exists: true } });
  // The old unique index is on the old fields, so it goes first: with it still there, renaming the fields would make
  // every report's entry in it empty, and two empty entries clash.
  const oldIndex = (await reports.indexes().catch(() => [])).find((index) => index.key.card === 1 && index.key.reporter === 1);
  if (dryRun) {
    if (oldIndex) log(`study_set_reports: its index "${oldIndex.name}" on card + reporter will be dropped for one on setId + by`);
    log(`study_set_reports: ${oldNamed} report(s) will get the new field names (setId, by, at)`);
  } else {
    if (oldIndex) {
      await reports.dropIndex(oldIndex.name);
      log(`study_set_reports: dropped "${oldIndex.name}" (card + reporter)`);
    }
    if (oldNamed) {
      await reports.updateMany({ card: { $exists: true } }, { $rename: OLD_FIELDS });
      log(`study_set_reports: ${oldNamed} report(s) now use setId, by and at`);
    }
  }
  await ensureIndex(db, "study_set_reports", { setId: 1, by: 1 }, { unique: true }, ctx);
}
