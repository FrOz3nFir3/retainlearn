import express from "express";
const apiRouter = express.Router();

import userRouter from "./user/user.router.js";
import cardsRouter from "./cards/cards.router.js";
import cardRouter from "./card/card.router.js";
import usersRouter from "./user/users.router.js";
import healthRouter from "./health.router.js";
import sitemapRouter from "./sitemap.router.js";
// The new endpoints (TypeScript, PLAN 14.15). Nothing uses them until the new screens do.
import studySetsRouter from "./studySets/studySets.router.ts";
import campusRouter from "./campus/campus.router.ts";
import { csrfProtectionMiddleware } from "../middleware/csrf.middleware.js";

apiRouter.use(csrfProtectionMiddleware);
apiRouter.use("/card", cardRouter);
apiRouter.use("/cards", cardsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/sitemap.xml", sitemapRouter);
apiRouter.use("/study-sets", studySetsRouter);
apiRouter.use("/campus", campusRouter);

export default apiRouter;
