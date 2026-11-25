import { Router } from "express";
const cardsRouter = Router();
import { NewStudySet } from "@retainlearn/core";
import { httpPostCreateNewCard } from "./cards.controller.js";
import { requireAuthenticationWithCSRF } from "../../middleware/auth.middleware.js";
import { createInvalidationMiddleware } from "../../middleware/cacheInvalidation.middleware.js";
import { validate } from "../../middleware/validate.ts";

// Making a study set (the subject page's "New study set"), until the editor's own endpoints replace it (P1-11). Its
// topics and subject are checked first, as the form checks them. The lists of subjects and their sets are /api/subjects.
cardsRouter.post("/", requireAuthenticationWithCSRF, validate({ body: NewStudySet }), createInvalidationMiddleware.cards(), httpPostCreateNewCard);

export default cardsRouter;
