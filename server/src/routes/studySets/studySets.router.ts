// /api/study-sets: studying a set. Its content is public, like its page; your progress and answers are your own.
import { Router } from "express";
import { requireAuthenticationWithCSRF } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import { answersInput, getProgress, getStudySet, postAnswers, setInput } from "./studySets.controller.ts";

const studySetsRouter = Router();

studySetsRouter.get("/:id", validate(setInput), getStudySet);
studySetsRouter.get("/:id/progress", requireAuthenticationWithCSRF, validate(setInput), getProgress);
studySetsRouter.post("/:id/answers", requireAuthenticationWithCSRF, validate(answersInput), postAnswers);
studySetsRouter.use(jsonErrors);

export default studySetsRouter;
