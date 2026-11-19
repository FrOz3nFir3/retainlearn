import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../../config/env.js";

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;

const ACCESS_TOKEN_EXPIRY_HOURS = 3;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// JWT `expiresIn` as a string (e.g., "3h", "30d")
const ACCESS_TOKEN_EXPIRY_JWT = `${ACCESS_TOKEN_EXPIRY_HOURS}h`;
const REFRESH_TOKEN_EXPIRY_JWT = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;

// Cookie `maxAge` in milliseconds
export const ACCESS_TOKEN_MAX_AGE_MS =
  ACCESS_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Tokens carry the account's token version (`v`) from when they were issued (P0-13). Logging out moves the account's
// version on, and a refresh token with an older one is refused (httpRefreshToken), so every session ends. Accounts
// and tokens from before versions existed have none, which counts as 0.
export function createAccessToken(id, version = 0) {
  return jwt.sign({ id, v: version }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY_JWT,
  });
}

export function createRefreshToken(id, version = 0) {
  return jwt.sign({ id, v: version }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_JWT,
  });
}

export function verifyRefreshToken(token = "") {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (e) {
    return null;
  }
}

// CSRF Token Functions (Optimized for size + security)
export function createCSRFToken() {
  // Generate 32 bytes of cryptographically secure random data
  const randomToken = crypto.randomBytes(32).toString("hex");

  // Sign with HMAC using existing secret
  const signature = crypto
    .createHmac("sha256", ACCESS_TOKEN_SECRET)
    .update(randomToken)
    .digest("hex");

  // Return compact format: token.signature (128 chars total)
  return `${randomToken}.${signature}`;
}

export function verifyCSRFToken(signedToken) {
  try {
    if (!signedToken || typeof signedToken !== "string") {
      return false;
    }

    const parts = signedToken.split(".");
    if (parts.length !== 2) {
      return false;
    }

    const [token, signature] = parts;

    // Validate token and signature format
    if (!token || !signature) {
      return false;
    }

    // Recreate signature
    const expectedSignature = crypto
      .createHmac("sha256", ACCESS_TOKEN_SECRET)
      .update(token)
      .digest("hex");

    // Ensure both signatures are the same length before comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    // Convert to buffers with error handling
    let receivedBuffer, expectedBuffer;
    try {
      receivedBuffer = Buffer.from(signature, "hex");
      expectedBuffer = Buffer.from(expectedSignature, "hex");
    } catch (bufferError) {
      // Invalid hex string
      return false;
    }

    // Final length check (extra safety)
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (error) {
    return false;
  }
}

// Starts a session, or renews one on refresh: a new access token, a new refresh token (good for another 30 days),
// and a new CSRF token. `user` needs `_id` and `tokenVersion`.
export function setTokens(res, user) {
  const version = user.tokenVersion ?? 0;
  const accessToken = createAccessToken(user._id, version);
  const refreshToken = createRefreshToken(user._id, version);
  const csrfToken = createCSRFToken(); // Generate CSRF token

  const isProduction = env.NODE_ENV === "production";

  res.cookie("jwt_access", accessToken, {
    httpOnly: true,
    signed: true,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    secure: isProduction,
    sameSite: "lax",
    path: "/api",
  });

  res.cookie("jwt_refresh", refreshToken, {
    httpOnly: true,
    signed: true,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/user",
  });

  // doesn't work across cross domains need to enable this later
  // res.cookie("session-status", "active", {
  //   httpOnly: false,
  //   signed: false,
  //   maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  //   secure: isProduction,
  //   sameSite: isProduction ? "none" : "lax",
  //   path: "/",
  // });

  // Set CSRF token as HttpOnly session cookie (expires when browser closes)
  res.cookie("csrf_token", csrfToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api",
  });

  return csrfToken;
}

// Removes the session cookies from this browser (logging out, or a session that has ended).
export function clearSessionCookies(res) {
  const options = env.NODE_ENV === "production" ? { secure: true, sameSite: "none" } : {};
  res.clearCookie("jwt_access", { path: "/api", ...options });
  res.clearCookie("jwt_refresh", { path: "/api/user", ...options });
  res.clearCookie("csrf_token", { path: "/api", ...options });
}
