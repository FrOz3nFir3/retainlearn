// /api/report-card: your report card, for signed-in players.
import { Router } from "express";
import { requireAuthenticationWithCSRF } from "#middleware/auth.middleware.js";
import { validate } from "#middleware/validate.ts";
import { jsonErrors } from "#middleware/routeHelpers.ts";
import { getReportCard, reportCardInput } from "./reportCard.controller.ts";

const reportCardRouter = Router();

reportCardRouter.get("/", requireAuthenticationWithCSRF, validate(reportCardInput), getReportCard);
reportCardRouter.use(jsonErrors);

export default reportCardRouter;
