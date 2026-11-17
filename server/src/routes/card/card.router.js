import { Router } from "express";
const cardRouter = Router();
import {
  httpPatchUpdateCard,
  httpGetCardById,
  httpGetCardLogs,
  httpAcceptReviewItem,
  httpRejectReviewItem,
  httpGetCardReviewers,
  httpAddCardReviewers,
  httpRemoveCardReviewer,
  httpGetReviewQueueItems,
  httpReportCard,
} from "./card.controller.js";
import { requireAuthenticationWithCSRF } from "../../middleware/auth.middleware.js";
import { checkReviewPermissions, requireReviewPermission } from "../../middleware/reviewPermission.middleware.js";
import { createCacheMiddleware } from "../../middleware/cache.middleware.js";
import { createInvalidationMiddleware } from "../../middleware/cacheInvalidation.middleware.js";

// The review queue (suggested changes waiting for review, and who suggested them) is for signed-in users (P0-09),
// in both of the ways it's read.
const requireLoginForReviewQueue = (req, res, next) =>
  req.query.view === "review-queue" ? requireAuthenticationWithCSRF(req, res, next) : next();

// Apply cache middleware to GET endpoints with view-specific caching. Every check runs before the cache, so a cached
// response only ever goes to someone allowed to see it (P0-08).
cardRouter.get("/:id", requireLoginForReviewQueue, createCacheMiddleware.cards(), httpGetCardById);
cardRouter.get("/:id/logs", createCacheMiddleware.cards(), httpGetCardLogs);
cardRouter.get("/:id/review-queue", requireAuthenticationWithCSRF, createCacheMiddleware.reviewQueue(), httpGetReviewQueueItems);
cardRouter.get("/:id/reviewers", requireAuthenticationWithCSRF, checkReviewPermissions, requireReviewPermission, createCacheMiddleware.cards(), httpGetCardReviewers);

// Apply invalidation middleware to mutation endpoints
cardRouter.post("/:id/reviewers", requireAuthenticationWithCSRF, checkReviewPermissions, createInvalidationMiddleware.auto(), httpAddCardReviewers);
cardRouter.delete("/:id/reviewers/:username", requireAuthenticationWithCSRF, checkReviewPermissions, createInvalidationMiddleware.auto(), httpRemoveCardReviewer);
cardRouter.patch("/", requireAuthenticationWithCSRF, checkReviewPermissions, createInvalidationMiddleware.auto(), httpPatchUpdateCard);
cardRouter.post("/:id/review-queue/:itemId/accept", requireAuthenticationWithCSRF, checkReviewPermissions, createInvalidationMiddleware.auto(), httpAcceptReviewItem);
cardRouter.post("/:id/review-queue/:itemId/reject", requireAuthenticationWithCSRF, checkReviewPermissions, createInvalidationMiddleware.auto(), httpRejectReviewItem);
cardRouter.post("/:id/report", requireAuthenticationWithCSRF, httpReportCard);

export default cardRouter;
