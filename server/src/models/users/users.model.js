import Users from "../users/users.mongo.js";
import crypto from "crypto";
import { escapeRegex, normalizeEmail } from "../../utils/textNormalization.js";

export async function findUserByEmail(email, projection = {}) {
  return Users.findOne({ email: String(email) }, projection).lean();
}

// $eq here and in findUserByEmailOrUsername: a value that isn't text is only ever compared, never read as a query.
export async function findUserByUsername(username, projection = {}) {
  return Users.findOne({ username: { $eq: username } }, projection).lean();
}

export async function getPublicUserByUsername(username, excludeId = true) {
  return Users.findOne({
    username,
  })
    .select(`name username ${excludeId ? "-_id" : ""}`)
    .lean();
}

export async function findUserByEmailOrUsername(
  loginIdentifier,
  projection = {}
) {
  return Users.findOne(
    {
      $or: [{ email: { $eq: loginIdentifier } }, { username: { $eq: loginIdentifier } }],
    },
    projection
  ).lean();
}

export async function findUserByGoogleId(googleId, projection = {}) {
  // test this as _.doc is been used
  return Users.findOne({ googleId: { $eq: googleId } }, projection).lean();
}

export async function getUserById(userId, projection = {}) {
  if (userId === "null" || userId === "undefined") {
    return null;
  }
  return Users.findOne({ _id: { $eq: userId } }, projection).lean();
}

export async function createNewUser(user) {
  const newUser = new Users(user);
  return newUser.save();
}

// Ends every session of this user: tokens issued before now carry an older token version, and refreshing one fails.
export async function endAllSessions(userId) {
  return Users.updateOne({ _id: { $eq: userId } }, { $inc: { tokenVersion: 1 } });
}

// A free username for a new Google account, from the letters and digits before the email's "@". Usernames are 3 to
// 30 characters: a short or symbol-only name ("jo@…") gets "user" added, and a long one is cut to 20, leaving room for
// a random suffix when the name is taken.
export async function generateUniqueUsername(email) {
  let base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 20);
  if (base.length < 3) base = `${base}user`;
  let username = base;
  for (let attempt = 0; await findUserByUsername(username, { _id: 1 }); attempt++) {
    // Cryptographically secure random suffix; a longer one after a few collisions.
    username = `${base}${crypto.randomBytes(attempt < 5 ? 2 : 4).toString("hex")}`;
  }
  return username;
}

// The updated user, with only the fields in `projection` (never the password hash, unless asked for).
export async function updateUser(userId, userDetails, projection = { password: 0, studying: 0 }) {
  return Users.findOneAndUpdate({ _id: { $eq: userId } }, userDetails, {
    new: true,
    projection,
  }).lean();
}

/**
 * Search users by name or username or email with pagination
 */
export async function searchUsers(searchTerm, page = 1, limit = 10) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return { users: [], total: 0, hasMore: false, page, limit };
  }

  const skip = (page - 1) * limit;
  const trimmedSearch = searchTerm.trim();

  // Create regex for case-insensitive search
  const searchRegex = new RegExp(escapeRegex(trimmedSearch), "i");

  // Names and usernames match any part. An email matches only as the whole address, so searching never reveals any
  // part of someone's email.
  const email = normalizeEmail(trimmedSearch);

  const pipeline = [
    {
      $match: {
        $or: [
          { username: searchRegex },
          { name: searchRegex },
          ...(email ? [{ email: { $eq: email } }] : []),
        ],
      },
    },
    {
      $facet: {
        users: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              name: 1,
              username: 1,
            },
          },
        ],
        totalCount: [{ $count: "total" }],
      },
    },
  ];

  const result = await Users.aggregate(pipeline);
  const users = result[0]?.users || [];
  const total = result[0]?.totalCount[0]?.total || 0;
  const hasMore = skip + limit < total;

  return {
    users,
    total,
    hasMore,
    page,
    limit,
  };
}
