// The campus (PLAN 14.10): everything it shows, in one call. Two point reads on most loads (your player and today's
// activity); at the day's first load the timetable and fading cards are drawn up from your progress, and kept.
import type { Request, Response } from "express";
import { CampusQuery, dayKey, daysSince, subjectStatus } from "@retainlearn/core";
import type { Campus, When } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import { campusPlayer, playerOf } from "#models/players/players.model.ts";
import { activityOf } from "#models/activity/activity.model.ts";
import { planToday, subjectsFromProgress } from "#services/campus.ts";

export const campusInput = { query: CampusQuery };

// GET /api/campus?tz=Asia/Kolkata
export async function getCampus(req: Request, res: Response) {
  const { query } = inputOf<typeof campusInput>(res);
  const userId = userIdOf(req);
  const when: When = { today: dayKey(new Date(), query.tz), timeZone: query.tz };
  const player = await playerOf(userId, query.tz, () => subjectsFromProgress(userId, when));
  const subjects = player.subjects ?? [];
  const day = await activityOf(userId, when.today, () =>
    planToday(
      userId,
      subjects.map((s) => s.category),
      when,
    ),
  );
  res.json({
    day: when.today,
    player: campusPlayer(player, when.today),
    subjects: subjects.map((s) => ({
      category: s.category,
      plot: s.plot,
      started: s.started,
      mastery: s.mastery,
      missed: s.missed,
      lastAt: s.lastAt ? new Date(s.lastAt).toISOString() : null,
      status: subjectStatus({ empty: false, started: s.started, daysAgo: s.lastAt ? daysSince(s.lastAt, when) : null }),
    })),
    timetable: day.timetable,
    fading: day.fading,
    today: { xp: day.xp, answers: day.answers },
  } satisfies Campus);
}
