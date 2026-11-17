// Sign-up takes only its own fields (P0-07), and emails are checked as plain addresses before anything else. The
// domain and mailbox check (email-deep-validator, which looks up DNS and talks to mail servers) is stood in for, so
// these tests stay offline.
import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import EmailValidator from "email-deep-validator";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import Users from "../src/models/users/users.mongo.js";

let t;
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});
let mailboxCheck;
beforeEach(() => {
  mock.restoreAll();
  mailboxCheck = mock.method(EmailValidator.prototype, "verify", async () => ({
    wellFormed: true,
    validDomain: true,
    validMailbox: true,
  }));
});

const PASSWORD = "Sign-up-pass1!";
const post = (path, body) =>
  t.api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const signUp = (fields) =>
  post("/api/user/register", { name: "New Person", password: PASSWORD, confirmPassword: PASSWORD, ...fields });

test("only the sign-up fields reach the new account", async () => {
  const res = await signUp({
    username: "new_person",
    email: "new.person@example.test",
    // Not sign-up fields: a Google id (which would sign the account in as that Google account), someone's progress,
    // and a chosen database id.
    googleId: "google-lee",
    studying: [{ cardId: ids.js, review: { lastReviewedCardNo: 5 } }],
    _id: "000000000000000000000a99",
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.username, "new_person");
  assert.doesNotMatch(JSON.stringify(body), /password|\$2[aby]\$/);

  const created = await Users.findOne({ username: "new_person" }).lean();
  assert.equal(created.googleId, undefined);
  assert.deepEqual(created.studying, []);
  assert.notEqual(created._id.toString(), "000000000000000000000a99");
  assert.notEqual(created.password, PASSWORD, "the password is stored hashed");
});

test("an email that isn't a plain address is refused before the mailbox check", async () => {
  for (const email of ["new.person@example.test\r\nRCPT TO:<someone>", "no-at-sign.example.test", { $ne: null }]) {
    const res = await signUp({ username: "line_breaks", email });
    assert.equal(res.status, 400, JSON.stringify(email));
  }
  assert.equal(mailboxCheck.mock.callCount(), 0);
  assert.equal(await Users.countDocuments({ username: "line_breaks" }), 0);
});

test("emails are stored lowercased, and signing in finds them however they're typed", async () => {
  const res = await signUp({ username: "mixed_case", email: "  Mixed.Case@Example.TEST " });
  assert.equal(res.status, 200);
  assert.equal((await Users.findOne({ username: "mixed_case" }).lean()).email, "mixed.case@example.test");

  const login = await post("/api/user/login", { loginIdentifier: "MIXED.case@example.test", password: PASSWORD });
  assert.equal(login.status, 200);
});

test("an email that's already used, in any case, can't sign up again", async () => {
  const res = await signUp({ username: "copy_of_ada", email: "ADA@example.test" });
  assert.equal(res.status, 409);
});
