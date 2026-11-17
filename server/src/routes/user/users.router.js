import express from "express";
import {
  httpGetPublicUserByUsername,
  httpSearchUsers,
} from "./user.controller.js";
import { httpGetCardsByAuthor } from "../cards/cards.controller.js";
import { requireAuthenticationWithCSRF } from "../../middleware/auth.middleware.js";
import { checkReviewPermissions, requireReviewPermission } from "../../middleware/reviewPermission.middleware.js";
import { createCacheMiddleware } from "../../middleware/cache.middleware.js";

const usersRouter = express.Router();

// TODO: later have this accept based on usernames only
// More specific routes should come first - apply cache middleware to GET endpoints
// The search is for a set's reviewers (to add more), and the check runs before the cache (P0-08).
usersRouter.get(
  "/search",
  requireAuthenticationWithCSRF,
  checkReviewPermissions,
  requireReviewPermission,
  createCacheMiddleware.search(),
  httpSearchUsers
);

// Parameterized routes should come after specific routes - apply cache middleware
usersRouter.get("/:username", createCacheMiddleware.users(), httpGetPublicUserByUsername);
usersRouter.get("/:username/cards", createCacheMiddleware.cards(), httpGetCardsByAuthor);

export default usersRouter;
