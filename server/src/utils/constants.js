export const userDetailsProjection = {
  name: 1,
  username: 1,
  email: 1,
  googleId: 1,
  studyingCount: { $size: "$studying" },
  // When the account was made: its id holds the moment (the profile says "joined November 2026").
  joinedAt: { $toDate: "$_id" },
  _id: 0,
};
