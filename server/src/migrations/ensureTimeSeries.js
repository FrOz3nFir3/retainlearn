// For migrations: makes sure a time-series collection exists. Unlike an ordinary collection, it can't appear by
// itself on the first insert (that would make an ordinary one, which can't be turned into a time series later), so a
// migration makes it. One that's already there as a time series on the same fields is left alone. An ordinary
// collection with the name, or a time series on other fields, is a problem to sort out by hand: nothing is dropped.
export async function ensureTimeSeries(db, name, timeseries, { dryRun, log, fail }) {
  const label = `${name} (time series on ${timeseries.timeField}, by ${timeseries.metaField})`;
  const [existing] = await db.listCollections({ name }).toArray();
  if (existing) {
    const { timeField, metaField } = existing.options?.timeseries ?? {};
    if (existing.type === "timeseries" && timeField === timeseries.timeField && metaField === timeseries.metaField) {
      return log(`${label}: already there`);
    }
    const what = existing.type === "timeseries" ? `a time series on ${timeField}, by ${metaField}` : "an ordinary collection";
    return fail(`${label}: "${name}" is already there as ${what}. Sort it out by hand first.`);
  }
  if (dryRun) return log(`${label}: will be made`);
  await db.createCollection(name, { timeseries });
  log(`${label}: made`);
}
