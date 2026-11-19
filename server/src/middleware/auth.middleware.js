import jwt from "jsonwebtoken";
import { verifyCSRFToken } from "../routes/user/auth.controller.js";
import env from "../config/env.js";

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;

export function attachTokenIfAuthenticated(req, res, next) {
  // in case of 404 routes
  if (!req.signedCookies) return next();
  const token = req.signedCookies.jwt_access;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.token = decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      res.clearCookie("jwt_access");
    }
  }

  // Always continue to the next middleware.
  return next();
}

// Both checks below mark the route as for signed-in users only. What it returns may be that user's own, so:
// - the server's cache keeps it per user (`req.signedInOnly`, read by cache.middleware.js);
// - shared caches (Cloudflare, proxies) are told not to keep it.
// That holds for every such route, with no list of routes to keep up to date.
function markSignedInOnly(req, res) {
  req.signedInOnly = true;
  res.set("Cache-Control", "private, no-cache, must-revalidate");
}

// Pure authentication middleware - only validates JWT
export function requireAuthentication(req, res, next) {
  const token = req.token;

  if (!token) {
    return res.status(401).json({ error: "User not Logged In." });
  }

  markSignedInOnly(req, res);
  next();
}

// Combined auth + CSRF middleware for protected routes
export function requireAuthenticationWithCSRF(req, res, next) {
  const token = req.token;

  if (!token) {
    return res.status(401).json({ error: "User not Logged In." });
  }

  // CSRF validation for authenticated routes
  const cookieToken = req.cookies.csrf_token;
  const headerToken = req.headers["x-csrf-token"];

  // Both cookie and header must be present
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: "CSRF token missing - request will be automatically retried.",
    });
  }

  // Both tokens must match
  if (cookieToken !== headerToken) {
    return res.status(403).json({
      error: "CSRF token mismatch - request will be automatically retried.",
    });
  }

  // Verify token signature
  if (!verifyCSRFToken(cookieToken)) {
    return res.status(403).json({
      error: "Invalid CSRF token - request will be automatically retried.",
    });
  }

  markSignedInOnly(req, res);
  next();
}
