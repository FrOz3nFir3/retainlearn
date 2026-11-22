// /api/campus: your campus, for signed-in players.
import { Router } from "express";
import { requireAuthenticationWithCSRF } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import { campusInput, getCampus } from "./campus.controller.ts";

const campusRouter = Router();

campusRouter.get("/", requireAuthenticationWithCSRF, validate(campusInput), getCampus);
campusRouter.use(jsonErrors);

export default campusRouter;
