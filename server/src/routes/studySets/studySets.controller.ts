// Studying a set (PLAN 14.4, 14.10): its content, your progress in it, and saving your answers as a class goes.
import type { Request, Response } from "express";
import { ResetQuizQuery, SaveAnswers, SetParams, StudySetOrder, dayKey } from "@retainlearn/core";
import type { SavedAnswers, When } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { userIdOf } from "#middleware/routeHelpers.ts";
import { studySetContent, studySetExists, studySetOutline } from "#models/studySets/studySets.model.ts";
import { progressView, resetQuiz, saveAnswers, setOrder } from "#models/progress/progress.model.ts";
import { logAnswers } from "#models/answers/answers.model.ts";
import { countAnswers, dropRetryPeriods, finishPeriod } from "#models/activity/activity.model.ts";
import { addBellBonus, addXp, finishClass, playerOf, refreshSubject, setClassLeft } from "#models/players/players.model.ts";
import { subjectSummary, subjectsFromProgress } from "#services/campus.ts";

export const setInput = { params: SetParams };
export const answersInput = { params: SetParams, body: SaveAnswers };
export const resetQuizInput = { params: SetParams, query: ResetQuizQuery };
export const orderInput = { params: SetParams, body: StudySetOrder };

const notFound = (res: Response) => res.status(404).json({ error: "There's no such study set" });

// GET /api/study-sets/:id: public, like the set's page.
export async function getStudySet(req: Request, res: Response) {
  const { params } = inputOf<typeof setInput>(res);
  const set = await studySetContent(params.id);
  if (!set) return notFound(res);
  res.json(set);
}

// GET /api/study-sets/:id/progress
export async function getProgress(req: Request, res: Response) {
  const { params } = inputOf<typeof setInput>(res);
  if (!(await studySetExists(params.id))) return notFound(res);
  res.json(await progressView(userIdOf(req), params.id));
}

// DELETE /api/study-sets/:id/progress/quiz?tz=…: the set's quizzes afresh. After it, as after a class: its subject's
// summary on your campus is refreshed (what you missed there changed), and today's periods to retry what you missed in
// the set come off the timetable, since there's nothing left to retry. A set you haven't started has nothing to reset.
export async function deleteQuizProgress(req: Request, res: Response) {
  const { params, query } = inputOf<typeof resetQuizInput>(res);
  const userId = userIdOf(req);
  const reset = await resetQuiz(userId, params.id);
  if (!reset) return (await studySetExists(params.id)) ? res.json(await progressView(userId, params.id)) : notFound(res);
  // The reset is saved by now, so a failure here is logged rather than refused: the next class refreshes these anyway.
  try {
    const at = new Date();
    const when: When = { today: dayKey(at, query.tz), timeZone: query.tz };
    const bonus = await dropRetryPeriods(userId, when.today, params.id, at);
    await addBellBonus(userId, bonus);
    if (reset.category) await refreshSubject(userId, await subjectSummary(userId, reset.category, when));
  } catch (error) {
    console.error("After resetting a quiz:", error);
  }
  res.json(reset.view);
}

// POST /api/study-sets/:id/answers
export async function postAnswers(req: Request, res: Response) {
  const { params, body } = inputOf<typeof answersInput>(res);
  const userId = userIdOf(req);
  const set = await studySetOutline(params.id);
  if (!set) return notFound(res);
  const inSet = { question: new Set(set.questions.map((q) => q._id)), flashcard: new Set(set.flashcards.map((f) => f._id)) };
  const stray = body.answers.find((answer) => !inSet[answer.kind].has(answer.itemId));
  if (stray) return res.status(400).json({ error: `body.answers: ${stray.itemId} isn't one of this set's ${stray.kind}s` });

  const at = new Date();
  const when: When = { today: dayKey(at, body.timeZone), timeZone: body.timeZone };
  await playerOf(userId, body.timeZone, () => subjectsFromProgress(userId, when));
  const saved = await saveAnswers(userId, set, body, at);
  if (!saved.saved) return res.json({ saved: false, flashcards: {}, questions: {}, earned: 0, xp: 0 } satisfies SavedAnswers);

  // What follows the save. The answers are saved by now, so a failure here is logged rather than refused: sending the
  // batch again would change nothing, since its number is saved.
  let bonus = 0;
  let finished: SavedAnswers["finished"];
  try {
    await Promise.all([logAnswers(userId, set._id, body.answers, at), countAnswers(userId, when.today, body.answers.length, saved.xp), addXp(userId, saved.xp)]);
    if (body.finished) {
      bonus = await finishPeriod(userId, when.today, set._id, body.mode, at);
      await addBellBonus(userId, bonus);
      const { streak, firstToday } = await finishClass(userId, when.today, await subjectSummary(userId, set.category, when), body.classKey);
      finished = { streak: streak.count, firstToday, timetableDone: bonus > 0 };
    } else if (saved.firstOfSitting) {
      await setClassLeft(userId, { setId: set._id, key: body.classKey, day: when.today });
    }
  } catch (error) {
    console.error("After saving answers:", error);
  }
  res.json({
    saved: true,
    flashcards: saved.flashcards,
    questions: saved.questions,
    earned: saved.earned,
    xp: saved.xp + bonus,
    ...(finished ? { finished } : {}),
  } satisfies SavedAnswers);
}

// PUT /api/study-sets/:id/order  { order }: your own order of the set's flashcards, or null for the author's. Every id
// must be one of the set's flashcards; ones left out (added since) go at the end. Answers with the order kept.
export async function putOrder(req: Request, res: Response) {
  const { params, body } = inputOf<typeof orderInput>(res);
  const set = await studySetOutline(params.id);
  if (!set) return notFound(res);
  const ids = new Set(set.flashcards.map((f) => f._id));
  if (body.order && !body.order.every((id) => ids.has(id))) return res.status(400).json({ error: "That order names flashcards this set doesn't have" });
  await setOrder(userIdOf(req), params.id, body.order);
  res.json({ order: body.order });
}
