// What your coach tells you on your campus (the prototype's data/coach.js): one thing at a time, the most useful
// first, said once and never nagging, the way a game's morning announcement works (your idea, 2026-11-12). The first
// line is what the coach comes over and says; the rest are named one-tap options under it, all at once, never a line
// at a time behind "What else?" (few would tap it). Only what's live: the stadium's lines (matches, penalties,
// training) come with the stadium. Plain TypeScript, tested in coach.test.ts.
import type { Campus, ClassMode, Day, Why } from "@retainlearn/core";
import type { IconName } from "#components/ui/Icon.tsx";
import { CLASS_KINDS, classPath, periodPath } from "#features/classes/modes.ts";
import { subjectPath } from "./subjects.ts";

// key: what the line is about, so the coach comes over only with something you haven't heard. act: its button, a
// page or a class (null: "Thanks"); a class's subject (category), so the 3D campus can walk you to its building first.
// more: a tour line's button, which moves on instead.
export type CoachAct = { label: string; to: string; category?: string };
export type CoachLine = { key: string; text: string; act: CoachAct | null; chip: { label: string; icon: IconName }; more?: string };

// Your coach: a name, a look (which of the 3D campus's characters they are: never the one that's you, 2) and the colour
// of their training top, from your username, so every player has their own and it's the same coach every day (a coach
// is someone you come to know). Your idea, 2026-11-13.
const NAMES = ["Riley", "Sam", "Alex", "Jordan", "Casey", "Morgan", "Robin", "Kai", "Noor", "Priya", "Mateo", "Amara", "Kenji", "Zara", "Leo", "Ines", "Aisha", "Yuki", "Nia", "Omar", "Freya", "Ravi", "Lena", "Tomas"];
const VARIANTS = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const TOPS = ["#F59E0B", "#14B8A6", "#F97066", "#8B5CF6", "#84CC16", "#0EA5E9", "#EC4899"];
export type Coach = { name: string; top: string; variant: number };
export function coachFor(username: string | null | undefined): Coach {
  let h = 7;
  for (const ch of String(username ?? "")) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  return { name: NAMES[h % NAMES.length] ?? "Riley", top: TOPS[Math.floor(h / 13) % TOPS.length] ?? "#F59E0B", variant: VARIANTS[Math.floor(h / 7) % VARIANTS.length] ?? 0 };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const listed = (parts: string[]) => (parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? ""));
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ICON: Record<ClassMode, IconName> = { review: "review", quiz: "quiz", reviewMissed: "focus", retryMissed: "focus" };
const MINUTES: Record<ClassMode, number> = { review: 5, quiz: 3, reviewMissed: 4, retryMissed: 3 };

// Why a period is on today, in the coach's words.
export function whySaid(why: Why, category: string | undefined): string {
  switch (why.kind) {
    case "missed":
      return `${why.n === 1 ? "Something you missed is" : `${why.n} things you missed are`} due back.`;
    case "fading":
      return `${why.n === 1 ? "One of its player cards is" : `${why.n} of its player cards are`} fading.`;
    case "cold":
      return `You haven't been in for ${plural(why.n, "day")}.`;
    case "continue":
      return `You're ${why.n} of ${why.of} flashcards in.`;
    case "new":
      return `You haven't started ${category ?? "it"} yet.`;
    case "path":
      return `It's step ${why.n} of your ${why.title} path.`;
  }
}

// The first time on your campus: who the coach is and how it all works, in three lines, before today's news.
const tour = (name: string): CoachLine[] => [
  { key: "tour:1", text: `Hi, I'm Coach ${name}! This is your campus: every subject you study is a building here, and it warms up as you learn.`, act: null, chip: { label: "The tour", icon: "sparkle" }, more: "Next" },
  { key: "tour:2", text: "You learn in short classes, about five minutes each: flashcards to recall, then a quiz. Every question you get right becomes a player card.", act: null, chip: { label: "The tour", icon: "sparkle" }, more: "Next" },
  { key: "tour:3", text: "Each day I'll tell you what's on your timetable. Tap me any time.", act: null, chip: { label: "The tour", icon: "sparkle" }, more: "What's on today?" },
];

// A class left halfway today, as its address carries it on: its round, or a mixed quiz (one of picked items, a retry
// say, isn't offered: its items are named in its own address).
const carryOnPath = (left: NonNullable<Campus["player"]["classLeft"]>, mode: ClassMode): string | null => {
  const round = left.key.split(":")[1] ?? "";
  if (round === "mix") return `${classPath(left.setId, mode)}?mix=1`;
  return /^\d+$/.test(round) ? `${classPath(left.setId, mode)}?round=${round}` : null;
};

export function coachLines(campus: Campus, username: string | null | undefined): CoachLine[] {
  const { player, timetable, subjects, fading, day } = campus;
  const lines: CoachLine[] = player.coach.toured ? [] : tour(coachFor(username).name);
  const tourLength = lines.length;
  const nextIndex = timetable.findIndex((p) => !p.done);
  const nextPeriod = timetable[nextIndex];
  const next: CoachLine | null = nextPeriod
    ? {
        key: `period:${nextIndex}:${nextPeriod.setId}:${nextPeriod.mode}`,
        text: `${nextIndex === 0 ? "First up today" : "Next on your timetable"}: ${nextPeriod.set?.subtopic ?? "a study set"}, in ${nextPeriod.set?.category ?? "your subjects"}. ${whySaid(nextPeriod.why, nextPeriod.set?.category)} ${CLASS_KINDS[nextPeriod.mode].label}, about ${MINUTES[nextPeriod.mode]} minutes.`,
        act: { label: "Let's go", to: periodPath(nextPeriod), category: nextPeriod.set?.category },
        chip: { label: `Next: ${nextPeriod.set?.subtopic ?? "a class"}`, icon: ICON[nextPeriod.mode] },
      }
    : null;
  const fadingCount = fading.reduce((n, f) => n + f.count, 0);

  // Back after days away: what changed, without shaming, and the easiest way back in.
  if (player.away) {
    const cold = subjects.filter((s) => s.status === "cold").length;
    const changed = [cold && `${plural(cold, "building")} went cold`, fadingCount && `${plural(fadingCount, "player card")} started fading`].filter((x): x is string => !!x);
    const streak = player.away.endedStreak > 0 ? `Your ${player.away.endedStreak}-day streak ended, but one class today starts a new one.` : player.streak.count > 0 ? "A streak freeze kept your streak safe." : "";
    lines.push({
      key: `welcome:${player.away.days}`,
      text: `Welcome back! You were away ${plural(player.away.days, "day")}. ${changed.length ? `${capital(listed(changed))}. ` : ""}${streak}`.trim(),
      act: next?.act ? { ...next.act, label: "Ease back in" } : null,
      chip: { label: "Ease back in", icon: "sparkle" },
    });
  }

  // A class you left halfway today.
  const left = player.classLeft;
  if (left && left.day === day && left.mode && (left.mode === "review" || left.mode === "quiz") && left.of && (left.index ?? 0) > 0 && (left.index ?? 0) < left.of) {
    const to = carryOnPath(left, left.mode);
    if (to) {
      const where = left.mode === "quiz" ? `${left.index} of ${left.of} answered` : `flashcard ${(left.index ?? 0) + 1} of ${left.of}`;
      lines.push({
        key: `left:${left.key}`,
        text: `You left ${left.subtopic ?? "a class"} halfway, at ${where}. Pick it up where you were?`,
        act: { label: "Carry on", to, category: left.category ?? undefined },
        chip: { label: `Carry on: ${left.subtopic ?? "your class"}`, icon: ICON[left.mode] },
      });
    }
  }

  // Today's timetable: its next period, or the bell once it's all done.
  if (next) lines.push(next);
  else if (timetable.length) lines.push({ key: "timetable-done", text: "That's today's timetable done, and the bell's rung. Anything more today is a bonus.", act: null, chip: { label: "Timetable done", icon: "bell" } });

  // Fading player cards: studying their subject brings them back.
  if (fadingCount) {
    const top = fading.toSorted((a, b) => b.count - a.count)[0];
    lines.push({
      key: `fading:${fadingCount}`,
      text: `${fadingCount === 1 ? "One of your player cards is" : `${fadingCount} of your player cards are`} fading${top && fading.length > 1 ? `, most in ${top.category}` : ""}. Studying there brings them back to full strength.`,
      act: top ? { label: `Go to ${top.category}`, to: subjectPath(top.category) } : null,
      chip: { label: `${plural(fadingCount, "fading card")}`, icon: "clock" },
    });
  }

  if (lines.length === tourLength) lines.push({ key: "quiet", text: "All quiet today. Pick a subject to study.", act: { label: "Browse subjects", to: "/subjects" }, chip: { label: "Browse subjects", icon: "layers" } });
  // Always one of the options: how you're doing, on your report card.
  lines.push({ key: "report", text: "Your report card: how you're doing overall.", act: { label: "Report card", to: "/report-card" }, chip: { label: "Report card", icon: "report" } });
  return lines;
}

// Whether the coach has news: a first line you haven't been told today.
export const isNews = (heard: string | null, today: Day, headline: string | undefined): boolean => !!headline && heard !== `${today}|${headline}`;
