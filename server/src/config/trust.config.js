// How much the app trusts new accounts with public study sets (P0-14). These are starting values, to tune or replace
// as the site grows: change them here.
// - An account is new for its first NEW_ACCOUNT_DAYS days (its age comes from its _id, which holds when it was made).
//   A new account's sets start unlisted: not in the categories, the category pages or the sitemap, and not indexed by
//   search engines. They're listed by themselves when the account stops being new.
// - Sets created per day, per account: fewer for new accounts.
// - A set reported by REPORTS_TO_UNLIST different people is unlisted until someone lists it by hand.
export const TRUST = {
  NEW_ACCOUNT_DAYS: 7,
  SETS_PER_DAY_NEW_ACCOUNT: 3,
  SETS_PER_DAY: 10,
  REPORTS_TO_UNLIST: 3,
};

export const DAY_MS = 24 * 60 * 60 * 1000;

// When an account stops being new.
export function trustedFrom(accountId) {
  const created = accountId.getTimestamp();
  return new Date(created.getTime() + TRUST.NEW_ACCOUNT_DAYS * DAY_MS);
}
