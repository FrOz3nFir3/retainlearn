// The campus (PLAN 14.10): everything it shows, in one call. Two point reads on most loads (your player and today's
// activity); at the day's first load the timetable and fading cards are drawn up from your progress, and kept.
import type { Request, Response } from "express";
import { CampusQuery, currentStreak, dayKey, daysSince, levelOf, subjectStatus } from "@retainlearn/core";
import type { Campus, When } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import { playerOf } from "#models/players/players.model.ts";
import { activityOf } from "#models/activity/activity.model.ts";
import { planToday, subjectsFromProgress } from "#services/campus.ts";

export const campusInput = { query: CampusQuery };

// GET /api/campus?tz=Asia/Kolkata
export async function getCampus(req: Request, res: Response) {
  const { query } = inputOf<typeof campusInput>(res);
  const userId = userIdOf(req);
  const now = new Date();
  const when: When = { today: dayKey(now, query.tz), timeZone: query.tz };
  const player = await playerOf(userId, query.tz, () => subjectsFromProgress(userId, when));
  const day = await activityOf(userId, when.today, () =>
    planToday(
      userId,
      player.subjects.map((s) => s.category),
      when,
    ),
  );
  const { settings, coach } = player;
  res.json({
    day: when.today,
    player: {
      settings: {
        view3d: settings.view3d,
        look: settings.look,
        sky: settings.sky,
        theme: settings.theme,
        studyView: settings.studyView,
        extraTime: settings.extraTime,
        timeZone: settings.timeZone,
      },
      coach: { heard: coach.heard, quiet: coach.quiet, toured: coach.toured },
      xp: player.xp,
      level: levelOf(player.xp),
      streak: { count: currentStreak(player.streak, when.today), freezes: player.streak.freezes },
      unlocks: player.unlocks,
      classLeft: player.classLeft ? { setId: String(player.classLeft.setId), key: player.classLeft.key, day: player.classLeft.day } : null,
    },
    subjects: player.subjects.map((s) => ({
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
