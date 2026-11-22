// Each account's player (PLAN 14.3b): settings, XP, the streak, and the campus's subjects. Made at the first campus
// visit or the first saved class, with its subjects worked out from the progress already there.
import { Types } from "mongoose";
import Player from "#models/players/players.mongo.js";
import { streakAfterClass } from "@retainlearn/core";
import type { Day, Streak } from "@retainlearn/core";

export type SubjectSummary = { category: string; started: number; mastery: number; missed: number; lastAt: Date | null };
export type StoredSubject = SubjectSummary & { plot: number };
export type StoredPlayer = {
  _id: Types.ObjectId;
  settings: { view3d: boolean | null; look: string; sky: string; theme: string; studyView: string; extraTime: boolean; timeZone: string };
  coach: { heard: string | null; quiet: string | null; toured: boolean };
  xp: number;
  streak: Streak;
  unlocks: string[];
  subjects: StoredSubject[];
  classLeft: { setId: Types.ObjectId; key: string; day: Day } | null;
};

const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

// The first plot not taken: each subject is a building in its own place on the campus.
function nextPlot(subjects: readonly StoredSubject[]): number {
  const taken = new Set(subjects.map((s) => s.plot));
  let plot = 0;
  while (taken.has(plot)) plot++;
  return plot;
}

// The player, made with defaults if it isn't there yet: the browser's time zone, and the subjects from the progress
// already there (subjects()), each on its own plot.
export async function playerOf(userId: string, timeZone: string, subjects: () => Promise<SubjectSummary[]>): Promise<StoredPlayer> {
  const found = await Player.findById(userId).lean<StoredPlayer>();
  if (found) return found;
  const first = await subjects();
  try {
    const made = await Player.create({ _id: userId, settings: { timeZone }, subjects: first.map((s, plot) => ({ ...s, plot })) });
    return made.toObject() as StoredPlayer;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    return (await Player.findById(userId).lean<StoredPlayer>()) as StoredPlayer; // made by another request at the same moment
  }
}

export async function addXp(userId: string, xp: number): Promise<void> {
  if (xp) await Player.updateOne({ _id: userId }, { $inc: { xp } });
}

// A class left halfway, for the coach to mention.
export async function setClassLeft(userId: string, left: { setId: string; key: string; day: Day }): Promise<void> {
  await Player.updateOne({ _id: userId }, { $set: { classLeft: { ...left, setId: new Types.ObjectId(left.setId) } } });
}

// After a class is finished: the streak (the day's first class keeps it going), the subject's summary refreshed (or a
// new subject on its own plot), and no class left halfway.
export async function finishClass(userId: string, today: Day, subject: SubjectSummary): Promise<{ streak: Streak; firstToday: boolean }> {
  const player = await Player.findById(userId, { streak: 1, subjects: 1 }).lean<Pick<StoredPlayer, "streak" | "subjects">>();
  const { streak, firstToday } = streakAfterClass(player?.streak ?? { count: 0, lastDay: null, freezes: 0 }, today);
  const subjects = player?.subjects ?? [];
  const index = subjects.findIndex((s) => s.category === subject.category);
  const next = index >= 0 ? subjects.map((s, i) => (i === index ? { ...s, ...subject } : s)) : [...subjects, { ...subject, plot: nextPlot(subjects) }];
  await Player.updateOne({ _id: userId }, { $set: { streak, subjects: next, classLeft: null } });
  return { streak, firstToday };
}
