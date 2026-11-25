// The campus (PLAN 14.10): everything it shows, in one call. Two point reads on most loads (your player and today's
// activity); at the day's first load the timetable and fading cards are drawn up from your progress, and kept.
import type { Request, Response } from "express";
import { AddSubject, CampusQuery, SubjectParams, dayKey, daysSince, subjectStatus } from "@retainlearn/core";
import type { AddedSubject, Campus, When } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import { SUBJECTS_ADDED_MAX, addSubject, campusPlayer, playerOf, removeSubject } from "#models/players/players.model.ts";
import { activityOf } from "#models/activity/activity.model.ts";
import { planToday, subjectSummary, subjectsFromProgress } from "#services/campus.ts";

export const campusInput = { query: CampusQuery };
export const addSubjectInput = { query: CampusQuery, body: AddSubject };
export const removeSubjectInput = { params: SubjectParams };

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

// POST /api/campus/subjects?tz=…  { name }: the subject's building on your campus, before you study it. Your player is
// made first if this is before your first visit; the subject's summary is worked out, as after a class, in case you
// have progress in it already. 201 when it's put up, 200 when it was there.
export async function postSubject(req: Request, res: Response) {
  const { query, body } = inputOf<typeof addSubjectInput>(res);
  const userId = userIdOf(req);
  const when: When = { today: dayKey(new Date(), query.tz), timeZone: query.tz };
  const player = await playerOf(userId, query.tz, () => subjectsFromProgress(userId, when));
  const answer = { name: body.name } satisfies AddedSubject;
  if (player.subjects?.some((s) => s.category === body.name)) return res.json(answer);
  const added = await addSubject(userId, await subjectSummary(userId, body.name, when));
  if (added === "full") return res.status(409).json({ error: `Your campus has ${SUBJECTS_ADDED_MAX} subjects, the most it can hold. Take one away first.` });
  res.status(added === "added" ? 201 : 200).json(answer);
}

// DELETE /api/campus/subjects/:name: the subject's building taken down, while you haven't started it. 409 when you
// have: it stays, with your progress.
export async function deleteSubject(req: Request, res: Response) {
  const { params } = inputOf<typeof removeSubjectInput>(res);
  const removed = await removeSubject(userIdOf(req), params.name);
  if (removed === "kept") return res.status(409).json({ error: "You've started studying this subject, so it stays on your campus." });
  res.status(204).end();
}
