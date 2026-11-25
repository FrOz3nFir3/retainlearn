// The subjects (PLAN 14.10): every subject with its counts, a page at a time, and one subject's study sets. Public,
// like their pages: what you've done in them comes from your campus and your report card, which the pages already have.
import type { Request, Response } from "express";
import { SUBJECTS_PER_PAGE, SubjectParams, SubjectsQuery } from "@retainlearn/core";
import type { Subject, SubjectsPage } from "@retainlearn/core";
import { inputOf } from "#middleware/validate.ts";
import { subjectSets, subjectsPage } from "#models/studySets/studySets.model.ts";

export const subjectsInput = { query: SubjectsQuery };
export const subjectInput = { params: SubjectParams };

// GET /api/subjects?search=…&page=…
export async function getSubjects(req: Request, res: Response) {
  const { query } = inputOf<typeof subjectsInput>(res);
  const { subjects, total } = await subjectsPage(query.search, query.page);
  res.json({ subjects, total, page: query.page, pages: Math.ceil(total / SUBJECTS_PER_PAGE) } satisfies SubjectsPage);
}

// GET /api/subjects/:name
export async function getSubject(req: Request, res: Response) {
  const { params } = inputOf<typeof subjectInput>(res);
  res.json({ name: params.name, sets: await subjectSets(params.name) } satisfies Subject);
}
