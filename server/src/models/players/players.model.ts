// Each account's player (PLAN 14.3b): settings, XP, the streak, and the campus's subjects. Made at the first campus
// visit or the first saved class, with its subjects worked out from the progress already there.
import { Types } from "mongoose";
import Player, { SETTINGS_DEFAULTS } from "#models/players/players.mongo.ts";
import type { PlayerDoc } from "#models/players/players.mongo.ts";
import { currentStreak, daysBetween, levelOf, streakAfterClass } from "@retainlearn/core";
import type { Campus, CoachPatchBody, Day, ReportCard, SettingsPatchBody, Streak } from "@retainlearn/core";

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
    away: awayOf(player, today),
    path: null, // the path you follow: the campus fills it in (services/campus.ts, followedPath)
  };
}

// Back after days without a class (the coach's welcome back): how many since your last finished class, and the streak
// that ended meanwhile (0 when a freeze kept it, or there was none). null when your last class was today or yesterday,
// or you've never finished one.
function awayOf(player: Pick<PlayerDoc, "streak">, today: Day): Campus["player"]["away"] {
  const last = player.streak?.lastDay;
  if (!last) return null;
  const days = daysBetween(last, today);
  if (days < 2) return null;
  return { days, endedStreak: currentStreak(streakOf(player), today) === 0 ? (player.streak?.count ?? 0) : 0 };
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

// Some of your settings, the ones given (PATCH /api/campus/settings), on a player already made.
export async function updateSettings(userId: string, patch: SettingsPatchBody): Promise<void> {
  const changes = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined).map(([key, value]) => [`settings.${key}`, value]));
  if (Object.keys(changes).length) await Player.updateOne({ _id: userId }, { $set: changes });
}

// What the coach has told you (PATCH /api/campus/coach): the fields sent.
export async function updateCoach(userId: string, patch: CoachPatchBody): Promise<void> {
  const changes = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined).map(([key, value]) => [`coach.${key}`, value]));
  if (Object.keys(changes).length) await Player.updateOne({ _id: userId }, { $set: changes });
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

// The most subjects a campus can have put on it by hand (POST /api/campus/subjects): a cap on what one account can
// add to its player. Subjects you study are added however many there are.
export const SUBJECTS_ADDED_MAX = 100;

// A subject's building, put up before you study it: on the first free plot, with its summary. Nothing changes if
// it's there already. As in finishClass, the write only goes through if the player is still as it was read, so two at
// the same moment can't take the same plot. "full": the campus has SUBJECTS_ADDED_MAX subjects already.
export async function addSubject(userId: string, subject: SubjectSummary): Promise<"added" | "there" | "full"> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const player = await Player.findById(userId, { subjects: 1, updatedAt: 1 }).lean<Pick<PlayerDoc, "subjects" | "updatedAt">>();
    if (!player) throw new Error("No player to add a subject to");
    const subjects = player.subjects ?? [];
    if (subjects.some((s) => s.category === subject.category)) return "there";
    if (subjects.length >= SUBJECTS_ADDED_MAX) return "full";
    const unchanged = player.updatedAt ? { updatedAt: player.updatedAt } : { updatedAt: { $exists: false } };
    const result = await Player.updateOne({ _id: userId, ...unchanged }, { $push: { subjects: { ...subject, plot: nextPlot(subjects) } } });
    if (result.matchedCount) return "added";
  }
  throw new Error("This player is being changed from elsewhere at the same moment");
}

// A subject's building taken down, if you haven't started a set in it (a class there would put it back). Its plot is
// free for the next subject. "kept": you've started it, so it stays. The filter says whether it can go (matchedCount):
// modifiedCount can't, since every update also sets updatedAt.
export async function removeSubject(userId: string, category: string): Promise<"removed" | "kept" | "absent"> {
  const notStarted = { category, started: 0 };
  const result = await Player.updateOne({ _id: userId, subjects: { $elemMatch: notStarted } }, { $pull: { subjects: notStarted } });
  if (result.matchedCount) return "removed";
  return (await Player.exists({ _id: userId, "subjects.category": category })) ? "kept" : "absent";
}

export async function addXp(userId: string, xp: number): Promise<void> {
  if (xp) await Player.updateOne({ _id: userId }, { $inc: { xp } });
}

// The last bell's reward, when it rings (bonus: 0 when it didn't): its bonus XP, and from the first time on, the
// fountain on the campus's quad (the prototype's unlock), in the same write.
export async function addBellBonus(userId: string, bonus: number): Promise<void> {
  if (bonus) await Player.updateOne({ _id: userId }, { $inc: { xp: bonus }, $addToSet: { unlocks: "fountain" } });
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

// Paths (P2-07): the one you follow (or none), the steps you tested out of ("pathId.stepId"), and the skills you've
// earned, each for good with its path's title as it was. Each write needs your player made first (playerOf).
export type PlayerPaths = { active: string | null; testedOut: string[]; skills: { pathId: string; title: string; at: Date }[] };
export async function pathsOf(userId: string): Promise<PlayerPaths> {
  const player = await Player.findById(userId, { paths: 1 }).lean<Pick<PlayerDoc, "paths">>();
  return {
    active: player?.paths?.active ? String(player.paths.active) : null,
    testedOut: player?.paths?.testedOut ?? [],
    skills: (player?.paths?.skills ?? []).map((s) => ({ pathId: String(s.pathId), title: s.title ?? "", at: s.at ?? new Date(0) })),
  };
}

export async function followPath(userId: string, pathId: string): Promise<void> {
  await Player.updateOne({ _id: userId }, { $set: { "paths.active": new Types.ObjectId(pathId) } });
}

// No longer following the path, if it's the one you follow.
export async function unfollowPath(userId: string, pathId: string): Promise<void> {
  await Player.updateOne({ _id: userId, "paths.active": new Types.ObjectId(pathId) }, { $set: { "paths.active": null } });
}

export async function addTestedOut(userId: string, key: string): Promise<void> {
  await Player.updateOne({ _id: userId }, { $addToSet: { "paths.testedOut": key } });
}

// A path's skill, once: earned again, the first stays (with its title and day).
export async function addSkill(userId: string, skill: { pathId: string; title: string; at: Date }): Promise<{ title: string; at: Date }> {
  const pathId = new Types.ObjectId(skill.pathId);
  await Player.updateOne({ _id: userId, "paths.skills.pathId": { $ne: pathId } }, { $push: { "paths.skills": { pathId, title: skill.title, at: skill.at } } });
  const earned = (await pathsOf(userId)).skills.find((s) => s.pathId === skill.pathId);
  return earned ? { title: earned.title, at: earned.at } : { title: skill.title, at: skill.at };
}
