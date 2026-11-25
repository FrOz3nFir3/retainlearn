import {
  httpPostAuthDetails,
  httpCreateNewUser,
  httpLoginUser,
  httpLoginGoogleUser,
  httpLogoutUser,
  httpUpdateUser,
  httpRefreshToken,
  httpGetCSRFToken,
} from "./user.controller.js";
import {
  requireAuthentication,
  requireAuthenticationWithCSRF,
} from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";
import { createInvalidationMiddleware } from "../../middleware/cacheInvalidation.middleware.js";

import { Router } from "express";
const userRouter = Router();

// Apply the API limiter to the authenticated user details endpoint
// /authed provides CSRF token, so only requires authentication (not CSRF)
userRouter.post("/authed", requireAuthentication, httpPostAuthDetails);

// Apply the stricter auth limiter to registration and login routes
userRouter.post("/register", authLimiter, httpCreateNewUser);
userRouter.post("/login", authLimiter, httpLoginUser);
userRouter.post("/google-login", authLimiter, httpLoginGoogleUser);

userRouter.post(
  "/logout",
  authLimiter,
  requireAuthenticationWithCSRF,
  httpLogoutUser
);
userRouter.post("/refresh", httpRefreshToken);

// Dedicated CSRF token endpoint for lightweight token refresh
userRouter.post("/csrf-refresh", requireAuthentication, httpGetCSRFToken);

// Apply invalidation middleware to user update operations
userRouter.patch("/",
  requireAuthenticationWithCSRF,
  createInvalidationMiddleware.users(),
  httpUpdateUser);

// Your progress in study sets is under /api/study-sets and /api/report-card now: the old progress endpoints went with
// the old study screens.

export default userRouter;
