// Each account's player (PLAN 14.3b): settings, XP, the streak, and the campus's subjects. Made at the first campus
// visit or the first saved class, with its subjects worked out from the progress already there.
import { Types } from "mongoose";
import Player, { SETTINGS_DEFAULTS } from "#models/players/players.mongo.ts";
import type { PlayerDoc } from "#models/players/players.mongo.ts";
import { currentStreak, levelOf, streakAfterClass } from "@retainlearn/core";
import type { Campus, Day, ReportCard, Streak } from "@retainlearn/core";

// A subject's summary, as the rules work it out from your progress in it (services/campus.ts). Stored on the player
// with its plot: the place of its building on the campus.
export type SubjectSummary = { category: string; started: number; mastery: number; missed: number; lastAt: Date | null };
type StoredSubject = PlayerDoc["subjects"][number];

const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;
const streakOf = (player: Pick<PlayerDoc, "streak"> | null): Streak => ({
  count: player?.streak?.count ?? 0,
  lastDay: player?.streak?.lastDay ?? null,
  freezes: player?.streak?.freezes ?? 0,
});

// Your player's totals for the report card, read only: no player is made here (one not made yet, before your first
// campus visit or class, has none).
export async function playerTotals(userId: string, today: Day): Promise<Pick<ReportCard, "xp" | "level" | "streak" | "subjects">> {
  const player = await Player.findById(userId, { xp: 1, streak: 1, subjects: 1 }).lean<Pick<PlayerDoc, "xp" | "streak" | "subjects">>();
  const xp = player?.xp ?? 0;
  return { xp, level: levelOf(xp), streak: { count: currentStreak(streakOf(player), today), freezes: player?.streak?.freezes ?? 0 }, subjects: player?.subjects?.length ?? 0 };
}

// The player as the campus shows it, every field there: one missing from the document (written before the field
// existed) reads as its default. The streak is the one to show today, and the level comes from XP.
export function campusPlayer(player: PlayerDoc, today: Day): Campus["player"] {
  const settings = player.settings;
  const coach = player.coach;
  const left = player.classLeft;
  const xp = player.xp ?? 0;
  return {
    settings: {
      view3d: settings?.view3d ?? SETTINGS_DEFAULTS.view3d,
      look: settings?.look ?? SETTINGS_DEFAULTS.look,
      sky: settings?.sky ?? SETTINGS_DEFAULTS.sky,
      theme: settings?.theme ?? SETTINGS_DEFAULTS.theme,
      studyView: settings?.studyView ?? SETTINGS_DEFAULTS.studyView,
      extraTime: settings?.extraTime ?? SETTINGS_DEFAULTS.extraTime,
      timeZone: settings?.timeZone ?? SETTINGS_DEFAULTS.timeZone,
    },
    coach: { heard: coach?.heard ?? null, quiet: coach?.quiet ?? null, toured: coach?.toured ?? false },
    xp,
    level: levelOf(xp),
    streak: { count: currentStreak(streakOf(player), today), freezes: player.streak?.freezes ?? 0, keptToday: player.streak?.lastDay === today },
    unlocks: player.unlocks ?? [],
    classLeft: left?.setId && left.key && left.day ? { setId: String(left.setId), key: left.key, day: left.day } : null,
  };
}

// The first plot not taken: each subject is a building in its own place on the campus.
function nextPlot(subjects: readonly StoredSubject[]): number {
  const taken = new Set(subjects.map((s) => s.plot));
  let plot = 0;
  while (taken.has(plot)) plot++;
  return plot;
}

// The player, made with defaults if it isn't there yet: the browser's time zone, and the subjects from the progress
// already there (subjects()), each on its own plot.
export async function playerOf(userId: string, timeZone: string, subjects: () => Promise<SubjectSummary[]>): Promise<PlayerDoc> {
  const found = await Player.findById(userId).lean<PlayerDoc>();
  if (found) return found;
  const first = await subjects();
  try {
    const made = await Player.create({ _id: userId, settings: { timeZone }, subjects: first.map((s, plot) => ({ ...s, plot })) });
    return made.toObject<PlayerDoc>();
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const other = await Player.findById(userId).lean<PlayerDoc>(); // made by another request at the same moment
    if (!other) throw error;
    return other;
  }
}

// A subject's summary refreshed outside a class (after a set's quizzes are reset), if the player has the subject. One
// update of that subject alone: it changes updatedAt, so a class finishing at the same moment reads again (finishClass).
export async function refreshSubject(userId: string, subject: SubjectSummary): Promise<void> {
  const { category, started, mastery, missed, lastAt } = subject;
  await Player.updateOne(
    { _id: userId, "subjects.category": category },
    { $set: { "subjects.$.started": started, "subjects.$.mastery": mastery, "subjects.$.missed": missed, "subjects.$.lastAt": lastAt } },
  );
}

export async function addXp(userId: string, xp: number): Promise<void> {
  if (xp) await Player.updateOne({ _id: userId }, { $inc: { xp } });
}

// A class left halfway, for the coach to mention.
export async function setClassLeft(userId: string, left: { setId: string; key: string; day: Day }): Promise<void> {
  await Player.updateOne({ _id: userId }, { $set: { classLeft: { ...left, setId: new Types.ObjectId(left.setId) } } });
}

// After a class is finished: the streak (the day's first class keeps it going), the subject's summary refreshed (or a
// new subject on its own plot), and that class no longer left halfway (another one left halfway still is). The write
// only goes through if the player is still as it was read (its updatedAt), so two classes finished at the same moment
// (two devices) can't drop a subject or count the streak twice: the later one reads again and retries.
export async function finishClass(userId: string, today: Day, subject: SubjectSummary, classKey: string): Promise<{ streak: Streak; firstToday: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const player = await Player.findById(userId, { streak: 1, subjects: 1, classLeft: 1, updatedAt: 1 }).lean<
      Pick<PlayerDoc, "streak" | "subjects" | "classLeft" | "updatedAt">
    >();
    if (!player) throw new Error("No player to finish a class for");
    const { streak, firstToday } = streakAfterClass(streakOf(player), today);
    const subjects = player.subjects ?? [];
    const index = subjects.findIndex((s) => s.category === subject.category);
    const next = index >= 0 ? subjects.map((s, i) => (i === index ? { ...s, ...subject } : s)) : [...subjects, { ...subject, plot: nextPlot(subjects) }];
    const left = !player.classLeft || player.classLeft.key === classKey ? { classLeft: null } : {};
    const unchanged = player.updatedAt ? { updatedAt: player.updatedAt } : { updatedAt: { $exists: false } };
    const result = await Player.updateOne({ _id: userId, ...unchanged }, { $set: { streak, subjects: next, ...left } });
    if (result.matchedCount) return { streak, firstToday };
  }
  throw new Error("This player is being changed from elsewhere at the same moment");
}
