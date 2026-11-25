// /api/subjects: the subjects and their study sets, for everyone.
import { Router } from "express";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import { getSubject, getSubjects, subjectInput, subjectsInput } from "./subjects.controller.ts";

const subjectsRouter = Router();

subjectsRouter.get("/", validate(subjectsInput), getSubjects);
subjectsRouter.get("/:name", validate(subjectInput), getSubject);
subjectsRouter.use(jsonErrors);

export default subjectsRouter;
