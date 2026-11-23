// Your activity, one document per day (PLAN 14.3b): the day's timetable and fading cards, worked out at its first load
// so they don't reshuffle, then what you did.
import { Types } from "mongoose";
import Activity from "#models/activity/activity.mongo.ts";
import type { ActivityDoc } from "#models/activity/activity.mongo.ts";
import { XP } from "@retainlearn/core";
import type { Campus, ClassMode, Day } from "@retainlearn/core";

export type PlannedPeriod = Campus["timetable"][number];
export type Fading = Campus["fading"];
export type StoredDay = { timetable: PlannedPeriod[]; fading: Fading; xp: number; answers: number; doneAt: Date | null };

const oid = (id: string) => new Types.ObjectId(id);
const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

// The day as the campus reads it. A period's why and set are kept as they were planned (planDay's shapes).
const fromDoc = (doc: ActivityDoc | null): StoredDay => ({
  timetable: (doc?.timetable ?? []).map(({ kind, setId, mode, arena, why, set, done }) => ({
    kind,
    ...(setId ? { setId: String(setId) } : {}),
    ...(mode ? { mode } : {}),
    ...(arena ? { arena } : {}),
    why,
    done: done ?? false,
    set: set ?? null,
  })) as PlannedPeriod[],
  fading: (doc?.fading ?? []).map(({ category, count }) => ({ category: category ?? "", count: count ?? 0 })),
  xp: doc?.xp ?? 0,
  answers: doc?.answers ?? 0,
  doneAt: doc?.doneAt ?? null,
});

// Today's activity. At the day's first load the timetable and fading cards are drawn up by plan() and kept. A plan
// with no classes isn't kept: a new player's first class can put something on today's timetable at the next load.
// Planning again is cheap then, since there's next to nothing to read.
export async function activityOf(userId: string, day: Day, plan: () => Promise<{ timetable: PlannedPeriod[]; fading: Fading }>): Promise<StoredDay> {
  const filter = { userId: oid(userId), day };
  const found = await Activity.findOne(filter).lean<ActivityDoc>();
  if (found?.timetable?.length) return fromDoc(found);
  const { timetable, fading } = await plan();
  if (!timetable.length) return { ...fromDoc(found), fading };
  try {
    const saved = await Activity.findOneAndUpdate(
      filter,
      { $set: { timetable: timetable.map((p) => ({ ...p, setId: p.setId ? oid(p.setId) : undefined })), fading } },
      { upsert: true, new: true },
    ).lean<ActivityDoc>();
    return fromDoc(saved);
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    return fromDoc(await Activity.findOne(filter).lean<ActivityDoc>()); // planned by another load at the same moment
  }
}

// Answers and XP from a saved batch, added to the day.
export async function countAnswers(userId: string, day: Day, answers: number, xp: number): Promise<void> {
  await Activity.updateOne({ userId: oid(userId), day }, { $inc: { answers, xp } }, { upsert: true });
}

// A finished class ticks off its period on the day's timetable (the first one for that set and kind of class not
// done yet). When that was the last one, the timetable's bonus XP is given, once. Returns the bonus given (0 or 50).
export async function finishPeriod(userId: string, day: Day, setId: string, mode: ClassMode, at: Date): Promise<number> {
  const filter = { userId: oid(userId), day };
  const ticked = await Activity.findOneAndUpdate(
    { ...filter, timetable: { $elemMatch: { kind: "class", setId: oid(setId), mode, done: false } } },
    { $set: { "timetable.$.done": true } },
    { new: true },
  ).lean<ActivityDoc>();
  if (!ticked?.timetable?.length || !ticked.timetable.every((p) => p.done)) return 0;
  const bonus = await Activity.updateOne({ ...filter, doneAt: { $exists: false } }, { $set: { doneAt: at }, $inc: { xp: XP.timetableDone } });
  return bonus.modifiedCount ? XP.timetableDone : 0;
}
