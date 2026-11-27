// /api/campus: your campus, for signed-in players, and the subjects you put on it.
import { Router } from "express";
import { requireAuthenticationWithCSRF } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import { addSubjectInput, campusInput, coachInput, deleteSubject, getCampus, patchCoach, patchSettings, postSubject, removeSubjectInput, settingsInput } from "./campus.controller.ts";

const campusRouter = Router();

campusRouter.get("/", requireAuthenticationWithCSRF, validate(campusInput), getCampus);
campusRouter.post("/subjects", requireAuthenticationWithCSRF, validate(addSubjectInput), postSubject);
campusRouter.delete("/subjects/:name", requireAuthenticationWithCSRF, validate(removeSubjectInput), deleteSubject);
campusRouter.patch("/settings", requireAuthenticationWithCSRF, validate(settingsInput), patchSettings);
campusRouter.patch("/coach", requireAuthenticationWithCSRF, validate(coachInput), patchCoach);
campusRouter.use(jsonErrors);

export default campusRouter;
