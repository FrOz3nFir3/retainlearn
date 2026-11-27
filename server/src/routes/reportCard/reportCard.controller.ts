// The report card (PLAN 14.10): your progress in every set you've started, and your player's totals, in one call. Two
// reads, side by side: your player by its id, and your progress on its userId + setId index.
import type { Request, Response } from "express";
import { ReportCardQuery, dayKey } from "@retainlearn/core";
import type { ReportCard } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import { pathsOf, playerTotals } from "#models/players/players.model.ts";
import { reportCardSets } from "#models/progress/progress.model.ts";

export const reportCardInput = { query: ReportCardQuery };

// GET /api/report-card?tz=Asia/Kolkata
export async function getReportCard(req: Request, res: Response) {
  const { query } = inputOf<typeof reportCardInput>(res);
  const userId = userIdOf(req);
  const [totals, sets, paths] = await Promise.all([playerTotals(userId, dayKey(new Date(), query.tz)), reportCardSets(userId), pathsOf(userId)]);
  const skills = paths.skills.map((s) => ({ pathId: s.pathId, title: s.title, at: s.at.toISOString() }));
  res.json({ ...totals, sets, skills } satisfies ReportCard);
}
