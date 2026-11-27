// The campus's summaries (PLAN 14.3b, 14.10), worked out with the shared rules from your progress and the study sets'
// counts: each subject's numbers, and today's timetable and fading cards.
import { fadingBySubject, pathPeriod, pathProgress, planDay, subjectStats, testedOutKey } from "@retainlearn/core";
import type { CampusPath, PathPeriod, When } from "@retainlearn/core";
import { countedSets, stepSetsOf } from "#models/studySets/studySets.model.ts";
import type { CountedSet } from "#models/studySets/studySets.model.ts";
import { allProgressOf, progressInSets } from "#models/progress/progress.model.ts";
import type { ProgressForRules } from "#models/progress/progress.model.ts";
import type { SubjectSummary } from "#models/players/players.model.ts";
import type { PlayerDoc } from "#models/players/players.mongo.ts";
import { canSee, pathById, versionOf } from "#models/paths/paths.model.ts";
import type { Fading, PlannedPeriod } from "#models/activity/activity.model.ts";

const bySet = (progress: readonly ProgressForRules[]) => Object.fromEntries(progress.map((p) => [p.setId, p]));

function summaryOf(category: string, sets: readonly CountedSet[], progress: ReturnType<typeof bySet>, when: When): SubjectSummary {
  const stats = subjectStats(sets, progress, when);
  return {
    category,
    started: stats.started,
    mastery: stats.mastery,
    missed: stats.missedFlashcards + stats.missedQuestions,
    lastAt: stats.lastAt != null ? new Date(stats.lastAt) : null,
  };
}

// Every subject you've studied, from your progress: for a player made at its first visit.
export async function subjectsFromProgress(userId: string, when: When): Promise<SubjectSummary[]> {
  const progress = await allProgressOf(userId);
  const categories = [...new Set(progress.map((p) => p.setInfo.category).filter((c): c is string => Boolean(c)))];
  if (!categories.length) return [];
  const sets = await countedSets(categories, progress.map((p) => p.setId));
  return categories.map((category) => summaryOf(category, sets.filter((s) => s.category === category), bySet(progress), when));
}

// One subject's summary, refreshed after a class in it.
export async function subjectSummary(userId: string, category: string, when: When): Promise<SubjectSummary> {
  const progress = await allProgressOf(userId, category);
  const sets = await countedSets([category], progress.map((p) => p.setId));
  return summaryOf(category, sets.filter((s) => s.category === category), bySet(progress), when);
}

// Today's timetable and fading cards across your subjects, for the day's first load. Each period keeps its set's
// titles, so the campus shows them without looking the set up again.
export async function planToday(userId: string, categories: readonly string[], when: When, path: PathPeriod | null = null): Promise<{ timetable: PlannedPeriod[]; fading: Fading }> {
  if (!categories.length) return { timetable: [], fading: [] };
  const progress = await allProgressOf(userId);
  const sets = (await countedSets(categories, progress.map((p) => p.setId))).filter((s) => categories.includes(s.category));
  const titles = new Map(sets.map((s) => [s._id, { topic: s.topic, subtopic: s.subtopic, category: s.category }]));
  const timetable = planDay({ sets, progress: bySet(progress), subjects: categories, today: when.today, timeZone: when.timeZone, path }).map((period) => ({
    ...period,
    set: titles.get(period.setId) ?? null,
  }));
  return { timetable, fading: fadingBySubject(sets, bySet(progress), when) };
}

// The path you follow (P2-07), while you can still see it: where you are along it, for the campus (its trail and tile),
// the coach and the report card, and its current step as today's first period (planToday). Three reads: the path, its
// steps' sets, and your progress in them; your test outs come with your player.
export async function followedPath(userId: string, paths: PlayerDoc["paths"] | undefined, when: When): Promise<{ summary: CampusPath; period: PathPeriod | null } | null> {
  const id = paths?.active ? String(paths.active) : null;
  if (!id) return null;
  const path = await pathById(id);
  if (!path || !canSee(path, userId)) return null;
  const version = versionOf(path);
  const sets = await stepSetsOf(version.steps.map((s) => s.setId));
  const progress = await progressInSets(userId, [...sets.keys()]);
  const along = pathProgress({ pathId: id, category: version.category, steps: version.steps, sets, progress, testedOut: paths?.testedOut ?? [], when });
  const current = along.current;
  return {
    summary: {
      _id: id,
      title: version.title,
      category: version.category,
      done: along.done,
      total: along.total,
      setIds: [...new Set(along.steps.map((s) => s.set._id))],
      current: current
        ? { n: along.steps.indexOf(current) + 1, stepId: current.step.id, setId: current.set._id, name: current.step.title || current.set.title, category: current.set.category, step: current.step.flashcardIds ? testedOutKey(id, current.step.id) : null }
        : null,
    },
    period: pathPeriod(id, version.title, along),
  };
}
