import {
  createNewUser,
  findUserByEmail,
  findUserByGoogleId,
  updateUserQuizProgress,
  updateUser,
  getDetailedReport,
  getUserReviewProgress,
  getUserStats,
  getUserQuizProgress,
  getUserById,
  updateUserReviewProgress,
  findUserByUsername,
  findUserByEmailOrUsername,
  generateUniqueUsername,
  getPublicUserByUsername,
  getUserStudyingCount,
  getUserLastReviewedByCardProgress,
  updateUserWeakCards,
  getFocusReviewData,
  getFocusQuizData,
  updateUserStrugglingQuiz,
  resetUserQuizProgress,
  searchUsers,
  endAllSessions,
} from "../../models/users/users.model.js";
import { getPagination } from "../../services/query.js";
import {
  setTokens,
  clearSessionCookies,
  verifyRefreshToken,
  createCSRFToken,
} from "./auth.controller.js";
import { compare } from "bcrypt";
import EmailValidator from "email-deep-validator";
const emailValidator = new EmailValidator({ timeout: 10000 });
import { userDetailsProjection } from "../../utils/constants.js";
import { normalizeEmail } from "../../utils/textNormalization.js";
import { googleAuth } from "../../services/googleAuth.js";

import env from "../../config/env.js";

const isProduction = env.NODE_ENV === "production";

export async function httpGetPublicUserByUsername(req, res) {
  const { username } = req.params;
  try {
    const user = await getPublicUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function httpRefreshToken(req, res) {
  const refreshTokenFromCookie = req.signedCookies.jwt_refresh;

  if (!refreshTokenFromCookie) {
    return res.status(401).json({ error: "User not Logged in" });
  }

  const decoded = verifyRefreshToken(refreshTokenFromCookie);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid refresh token." });
  }

  // The session must still be live (P0-13): the account exists, and nothing has ended its sessions since this token
  // was issued (logging out, or a Google sign-in with the account's email).
  const user = await getUserById(decoded.id, { tokenVersion: 1 });
  if (!user || (user.tokenVersion ?? 0) !== (decoded.v ?? 0)) {
    clearSessionCookies(res);
    return res.status(401).json({ error: "Your session has ended. Please sign in again." });
  }

  // New tokens all round, the refresh token included, so an active session keeps going.
  const csrfToken = setTokens(res, user);

  res.status(200).json({
    message: "Token refreshed successfully",
    csrfToken, // For Redux store update
  });
}

export async function httpGetCSRFToken(req, res) {
  const csrfToken = createCSRFToken();

  res.cookie("csrf_token", csrfToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api",
  });

  res.status(200).json({
    csrfToken,
  });
}

export async function httpPostAuthDetails(req, res) {
  const token = req.token; // From requireAuthentication middleware

  const user = await getUserById(token.id, userDetailsProjection);
  if (!user) {
    return res.status(404).json({ user: null });
  }

  // Generate fresh CSRF token for authenticated user
  const csrfToken = createCSRFToken();

  // TODO: make samesite back to lax after domain is same
  // Update CSRF session cookie
  res.cookie("csrf_token", csrfToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api",
  });

  res.status(200).json({
    user,
    csrfToken,
  });
}

// Sign up with a password. Only the sign-up fields are read (P0-07): anything else in the request, such as a Google id,
// progress or an _id, never reaches the new account.
export async function httpCreateNewUser(req, res) {
  const { name, username: rawUsername, email: rawEmail, password: userPassword, confirmPassword } = req.body ?? {};
  try {
    // --- Username Validation ---
    if (!rawUsername || typeof rawUsername !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }
    const username = rawUsername.trim();
    if (username.length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters" });
    }
    if (username.length > 30) {
      return res
        .status(400)
        .json({ error: "Username must be 30 characters or less" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: "Username can only contain letters, numbers, and underscores",
      });
    }
    const usernameExists = await findUserByUsername(username, { _id: 1 });
    if (usernameExists) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    // --- Name Validation ---
    const nameError = checkName(name);
    if (nameError) {
      return res.status(400).json({ error: nameError });
    }

    // --- Password Validation ---
    if (typeof userPassword !== "string" || userPassword.length === 0) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (userPassword !== confirmPassword) {
      return res.status(409).json({ error: "Confirm Password does not match" });
    }
    if (userPassword.length < 10) {
      return res
        .status(400)
        .json({ error: "Password must be at least 10 characters long" });
    }
    if (!/[A-Z]/.test(userPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(userPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(userPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one number" });
    }
    if (!/[!@#$%^&*]/.test(userPassword)) {
      return res.status(400).json({
        error:
          "Password must contain at least one special character (!@#$%^&*)",
      });
    }

    // --- Email Validation ---
    // Checked as a plain address before anything else, so nothing malformed reaches the domain and mailbox check.
    const email = normalizeEmail(rawEmail);
    if (!email) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    const userExists = await findUserByEmail(email, { _id: 1 });
    if (userExists != null) {
      return res.status(409).json({ error: "Email already exist" });
    }

    const { validDomain, validMailbox } = await emailValidator.verify(email);
    if (validDomain == false || validMailbox == false) {
      if (!validDomain) {
        return res.status(409).json({ error: "Invalid Email Domain" });
      }
      if (!validMailbox) {
        return res
          .status(409)
          .json({ error: "Invalid Email it cannot take mails" });
      }
      return res
        .status(409)
        .json({ error: "Invalid Email please try with different email" });
    }

    const user = await createNewUser({ name: name.trim(), username, email, password: userPassword });
    const csrfToken = setTokens(res, user);
    res.status(200).json({
      user: { name: user.name, username: user.username, email: user.email, studyingCount: 0 },
      csrfToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sign-up failed. Please try again." });
  }
}

// What's wrong with a display name, if anything.
function checkName(name) {
  if (typeof name !== "string" || name.trim() === "") return "Name is required";
  if (name.trim().length > 100) return "Name must be 100 characters or less";
  return null;
}

export async function httpUpdateUser(req, res) {
  try {
    const { id } = req.token;
    // A Google account is linked from a token Google issued for this app, checked with Google (services/googleAuth.js),
    // never from an id posted by the browser.
    const { name, email, username, googleAccessToken } = req.body ?? {};
    const updateFields = {};

    if (name != null) {
      const nameError = checkName(name);
      if (nameError) {
        return res.status(400).json({ error: nameError });
      }
      updateFields.name = name.trim();
    }

    if (username != null && typeof username !== "string") {
      return res.status(400).json({ error: "Username must be text" });
    }
    if (username) {
      const sanitizedUsername = username.trim();
      if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
        return res
          .status(400)
          .json({ error: "Username must be between 3 and 30 characters" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
        return res.status(400).json({
          error: "Username can only contain letters, numbers, and underscores",
        });
      }
      const existingUser = await findUserByUsername(sanitizedUsername, {
        _id: 1,
      });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(409).json({ error: "Username already in use" });
      }
      updateFields.username = sanitizedUsername;
    }

    if (email != null) {
      if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ error: "Email cannot be empty" });
      }
      // A plain address first, so nothing malformed reaches the domain and mailbox check.
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return res.status(400).json({ error: "Please enter a valid email address" });
      }
      const existingUser = await findUserByEmail(normalizedEmail, { _id: 1 });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const { validDomain, validMailbox } = await emailValidator.verify(normalizedEmail);
      if (validDomain == false || validMailbox == false) {
        return res.status(409).json({ error: "Invalid Email" });
      }
      updateFields.email = normalizedEmail;
    }

    if (googleAccessToken) {
      let google;
      try {
        google = await googleAuth.verifyAccessToken(String(googleAccessToken));
      } catch {
        return res.status(401).json({ error: "Google couldn't confirm that account. Please try again." });
      }
      const existingGoogleUser = await findUserByGoogleId(google.googleId, { _id: 1 });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== id) {
        return res.status(409).json({
          error: "This Google account is already linked to another user.",
        });
      }
      updateFields.googleId = google.googleId;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    await updateUser(id, updateFields);
    res.status(200).json(updateFields.googleId ? { ok: true, googleId: updateFields.googleId } : { ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Couldn't update your profile. Please try again." });
  }
}

export async function httpUpdateUserQuizProgress(req, res) {
  const { id } = req.token;
  const { resetProgress, card_id } = req.body;

  try {
    if (resetProgress) {
      await resetUserQuizProgress(id, card_id);
    } else {
      await updateUserQuizProgress(id, req.body);
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpUpdateUserReviewProgress(req, res) {
  const { id } = req.token;
  const { card_id, lastReviewedCardNo } = req.body;

  if (!card_id || lastReviewedCardNo === undefined) {
    return res
      .status(400)
      .json({ error: "card_id and lastReviewedCardNo are required." });
  }

  try {
    await updateUserReviewProgress(id, card_id, lastReviewedCardNo);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpLoginUser(req, res) {
  const { loginIdentifier, password } = req.body ?? {};
  // Only text is looked up. Anything else (an object, say) would be read by the database as a query (P0-10).
  if (typeof loginIdentifier !== "string" || loginIdentifier.trim() === "" || typeof password !== "string" || password === "") {
    return res.status(400).json({ error: "Please enter your email or username, and your password" });
  }
  // Usernames can't contain "@", so an identifier with one is an email address, and those are stored lowercased.
  const identifier = loginIdentifier.includes("@") ? normalizeEmail(loginIdentifier) ?? loginIdentifier.trim() : loginIdentifier.trim();
  try {
    const user = await findUserByEmailOrUsername(identifier, {
      ...userDetailsProjection,
      _id: 1,
      password: 1,
      tokenVersion: 1,
    });

    if (user == null) {
      return res
        .status(401)
        .json({ error: "User with that email or username does not exist" });
    }
    if (user.password == null) {
      return res.status(401).json({ error: "you have logged in with google" });
    }

    const isCorrect = await compare(password, user.password);
    if (isCorrect == false) {
      return res.status(401).json({ error: "password does not match" });
    }

    const csrfToken = setTokens(res, user);

    const { _id, password: p, tokenVersion, ...userDetails } = user;
    return res.status(200).json({
      user: userDetails,
      csrfToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Sign-in failed. Please try again." });
  }
}

// Sign in with Google. The browser sends the ID token Google gave it (`credential`), and the server verifies it
// with Google (services/googleAuth.js). Only the verified token says who this is. It used to trust an email and a
// Google id posted by the browser, so anyone could sign in as anyone.
export async function httpLoginGoogleUser(req, res) {
  const credential = req.body?.credential;
  if (typeof credential !== "string" || credential.length === 0) {
    return res.status(400).json({
      error: "Google sign-in failed. Please reload the page and try again.",
    });
  }

  let google;
  try {
    google = await googleAuth.verifyIdToken(credential);
  } catch {
    return res.status(401).json({ error: "Google sign-in couldn't be verified. Please try again." });
  }
  if (!google.googleId || !google.email || !google.emailVerified) {
    return res.status(401).json({
      error: "Your Google account's email address isn't verified, so it can't be used to sign in.",
    });
  }

  try {
    const email = normalizeEmail(google.email) ?? google.email;
    const projection = { ...userDetailsProjection, _id: 1, tokenVersion: 1 };
    let user = await findUserByGoogleId(google.googleId, projection);

    if (user == null) {
      const emailUser = await findUserByEmail(email, { _id: 1 });
      if (emailUser) {
        // An account with this email already exists, and Google has just shown that this person owns the email.
        // Nobody had shown that before: sign-up doesn't check emails, and the profile can change them. So whoever
        // else could get into the account is shut out: its password is removed (sign in with Google from now on),
        // any other Google account is replaced, and every session ends. The name the user chose is kept.
        user = await updateUser(
          emailUser._id,
          { $set: { googleId: google.googleId }, $unset: { password: 1 }, $inc: { tokenVersion: 1 } },
          projection
        );
      } else {
        const username = await generateUniqueUsername(email);
        await createNewUser({ email, name: google.name, googleId: google.googleId, username });
        user = await findUserByGoogleId(google.googleId, projection);
      }
    }

    const csrfToken = setTokens(res, user);
    const { _id, tokenVersion, ...userDetails } = user;
    return res.status(200).json({
      user: userDetails,
      csrfToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Google sign-in failed. Please try again." });
  }
}

// Logging out ends the account's sessions on every device (P0-13): the token version moves on, so no refresh token
// issued before now works. Access tokens already issued still work until they expire (3 hours at most).
export async function httpLogoutUser(req, res) {
  clearSessionCookies(res);
  try {
    await endAllSessions(req.token.id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Logging out failed. Please try again." });
  }
  return res.status(200).json({ ok: true });
}

export async function httpGetUserProgressPaginated(req, res) {
  const { id: userId } = req.token;
  const { skip, limit } = getPagination(req.query);
  const { search } = req.query;

  try {
    const { cards, total } = await getUserReviewProgress(userId, {
      skip,
      limit,
      search,
    });

    const hasMore = skip + limit < total;
    const page = Math.floor(skip / limit) + 1;

    return res.json({
      cards,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    console.log(error, "error in paginated progress");
    res.status(500).json({ error });
  }
}

export async function httpGetCardReviewProgress(req, res) {
  const { card_id } = req.params;
  const { id: userId } = req.token;

  if (!card_id) {
    return res.status(400).json({ error: "card_id is required" });
  }

  try {
    const cardProgress = await getUserLastReviewedByCardProgress({
      userId,
      cardId: card_id,
    });
    if (!cardProgress) {
      return res.status(200).json({ lastReviewedCardNo: 0 });
    }

    return res.status(200).json({
      lastReviewedCardNo: cardProgress.lastReviewedCardNo || 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpGetUserStats(req, res) {
  const { id: userId } = req.token;

  try {
    const stats = await getUserStats(userId);
    return res.json(stats);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpGetQuizProgress(req, res) {
  const { id: userId } = req.token;
  const { skip, limit } = getPagination(req.query);
  const { search } = req.query;

  try {
    const { cards, total } = await getUserQuizProgress(userId, {
      skip,
      limit,
      search,
    });
    const hasMore = skip + limit < total;
    const page = Math.floor(skip / limit) + 1;

    return res.json({
      cards,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
}

export async function httpGetDetailedReport(req, res) {
  const { card_id } = req.params;
  const { id: userId } = req.token;

  try {
    const attempts = await getDetailedReport(userId, card_id);
    res.status(200).json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function httpUpdateWeakCards(req, res) {
  const { id: userId } = req.token;
  const { cardId, flashcardId, rating, action } = req.body;

  if (!cardId || !flashcardId || !rating || !action) {
    return res.status(400).json({
      error: "cardId, flashcardId, rating, and action are required",
    });
  }

  if (!["add", "remove"].includes(action)) {
    return res.status(400).json({
      error: "action must be either 'add' or 'remove'",
    });
  }

  try {
    await updateUserWeakCards(userId, cardId, flashcardId, action);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpGetFocusReviewData(req, res) {
  const { card_id } = req.params;
  const { id: userId } = req.token;

  if (!card_id) {
    return res.status(400).json({ error: "card_id is required" });
  }

  try {
    const focusReviewData = await getFocusReviewData(userId, card_id);

    if (!focusReviewData) {
      return res
        .status(404)
        .json({ error: "Card not found or no review data" });
    }

    return res.status(200).json(focusReviewData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpGetFocusQuizData(req, res) {
  const { card_id } = req.params;
  const { id: userId } = req.token;

  if (!card_id) {
    return res.status(400).json({ error: "card_id is required" });
  }

  try {
    const focusQuizData = await getFocusQuizData(userId, card_id);

    if (!focusQuizData) {
      return res.status(404).json({ error: "Card not found or no quiz data" });
    }

    return res.status(200).json(focusQuizData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export async function httpUpdateUserStrugglingQuiz(req, res) {
  const { id: userId } = req.token;
  const { cardId, quizId, action } = req.body;

  if (!cardId || !quizId || !action) {
    return res.status(400).json({
      error: "cardId, quizId, and action are required",
    });
  }

  if (action !== "add" && action !== "remove") {
    return res.status(400).json({
      error: "action must be 'add' or 'remove'",
    });
  }

  try {
    await updateUserStrugglingQuiz(userId, cardId, quizId, action);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}
export async function httpSearchUsers(req, res) {
  const token = req.token;
  const { search: searchTerm } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 10;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if user has review permissions (already checked by middleware)
  if (!req.hasReviewPermission) {
    return res.status(403).json({
      error: "You don't have permission to search users for this card.",
    });
  }

  // Validate search term
  if (typeof searchTerm !== "string" || searchTerm.trim().length < 2) {
    return res.status(400).json({
      error: "Search term must be at least 2 characters long",
    });
  }

  try {
    const result = await searchUsers(searchTerm, page, limit);
    res.json(result);
  } catch (error) {
    console.log("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users" });
  }
}
