// For migrations: renames a collection in the same database. Its documents and indexes come along, and it takes a
// moment. Already renamed (or never there) is fine. Both names there is a problem to sort out by hand: nothing is
// dropped or merged.
export async function renameCollection(db, from, to, { dryRun, log, fail }) {
  const label = `${from} → ${to}`;
  const here = new Set((await db.listCollections({ name: { $in: [from, to] } }, { nameOnly: true }).toArray()).map((c) => c.name));
  if (!here.has(from)) return log(`${label}: ${here.has(to) ? "already renamed" : `there's no ${from}, nothing to rename`}`);
  if (here.has(to)) return fail(`${label}: both are here. Sort it out by hand first.`);
  const count = await db.collection(from).countDocuments();
  if (dryRun) return log(`${label}: will be renamed, with its ${count} document(s) and its indexes`);
  await db.collection(from).rename(to);
  log(`${label}: renamed (${count} document(s))`);
}
