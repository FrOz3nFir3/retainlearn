// Google sign-in is verified on the server (P0-05). Google itself is stood in for (mock.method on googleAuth), so
// these tests check what the server does with what Google says, and that nothing the browser posts can take its place.
// Before this fix, posting an email and any Google id signed you in as that email's owner.
import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import { googleAuth } from "../src/services/googleAuth.js";
import Users from "../src/models/users/users.mongo.js";

let t;
let ada; // signed in as Ada once, for the profile tests (sign-ins are rate limited)
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});
beforeEach(() => mock.restoreAll());

const googleLogin = (body) =>
  t.api("/api/user/google-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const googleSays = (who) => mock.method(googleAuth, "verifyIdToken", async () => who);
const lee = { googleId: "google-lee", email: "lee@example.test", emailVerified: true, name: "Lee From Google" };
const googleIdOf = async (id) => (await Users.findById(id).lean()).googleId;
const asAda = async () => (ada ??= await t.signIn("ada_author"));

test("an email and Google id posted by the browser sign no one in (the old way)", async () => {
  const res = await googleLogin({ email: "ada@example.test", name: "Anyone", googleId: "attacker" });
  assert.equal(res.status, 400);
  assert.equal(res.headers.getSetCookie().length, 0);
  assert.equal(await googleIdOf(ids.author), undefined);
});

test("an email with no Google id signs no one in (it used to sign you in as the first account without one)", async () => {
  const res = await googleLogin({ email: "someone.else@example.test", name: "Anyone" });
  assert.equal(res.status, 400);
  assert.equal(res.headers.getSetCookie().length, 0);
});

test("a malformed credential is refused by Google's own library (no stand-in)", async () => {
  const res = await googleLogin({ credential: "not-a-google-token" });
  assert.equal(res.status, 401);
  assert.equal(res.headers.getSetCookie().length, 0);
});

test("a credential Google doesn't vouch for is refused", async () => {
  mock.method(googleAuth, "verifyIdToken", async () => {
    throw new Error("Invalid token signature");
  });
  const res = await googleLogin({ credential: "forged" });
  assert.equal(res.status, 401);
  assert.equal(res.headers.getSetCookie().length, 0);
});

test("an unverified Google email can't sign in, or take over the account with that email", async () => {
  googleSays({ ...lee, emailVerified: false });
  const res = await googleLogin({ credential: "real-but-unverified" });
  assert.equal(res.status, 401);
  assert.equal(await googleIdOf(ids.learner), undefined);
});

test("a verified Google account links to the account with its email, and nothing secret comes back", async () => {
  googleSays(lee);
  const res = await googleLogin({ credential: "real" });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.username, "lee_learner");
  assert.equal(body.user.name, "Lee Learner", "the name they chose is kept, not replaced by Google's");
  assert.ok(body.csrfToken);
  assert.doesNotMatch(JSON.stringify(body), /password|\$2[aby]\$/);
  assert.ok(res.headers.getSetCookie().some((cookie) => cookie.startsWith("jwt_access=")));
  assert.equal(await googleIdOf(ids.learner), "google-lee");
});

test("a verified Google account with a new email gets a new account, with no password", async () => {
  googleSays({ googleId: "google-new", email: "new.person@example.test", emailVerified: true, name: "New Person" });
  const res = await googleLogin({ credential: "real" });
  assert.equal(res.status, 200);
  const created = await Users.findOne({ googleId: "google-new" }).lean();
  assert.equal(created.email, "new.person@example.test");
  assert.equal(created.password, undefined);
});

test("profile: a Google id posted by the browser isn't linked", async () => {
  const res = await t.api("/api/user", { method: "PATCH", headers: await asAda(), body: JSON.stringify({ googleId: "attacker" }) });
  assert.equal(res.status, 400);
  assert.equal(await googleIdOf(ids.author), undefined);
});

test("profile: Connect Google links the account Google confirms", async () => {
  mock.method(googleAuth, "verifyAccessToken", async () => ({ googleId: "google-ada", email: "ada@example.test", emailVerified: true }));
  const res = await t.api("/api/user", { method: "PATCH", headers: await asAda(), body: JSON.stringify({ googleAccessToken: "real" }) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).googleId, "google-ada");
  assert.equal(await googleIdOf(ids.author), "google-ada");
});

test("profile: a Google token Google won't confirm links nothing", async () => {
  mock.method(googleAuth, "verifyAccessToken", async () => {
    throw new Error("Invalid token");
  });
  const res = await t.api("/api/user", { method: "PATCH", headers: await asAda(), body: JSON.stringify({ googleAccessToken: "forged" }) });
  assert.equal(res.status, 401);
});

test("profile: a Google account already linked to someone else isn't linked again", async () => {
  mock.method(googleAuth, "verifyAccessToken", async () => ({ googleId: "google-lee", email: "lee@example.test", emailVerified: true }));
  const res = await t.api("/api/user", { method: "PATCH", headers: await asAda(), body: JSON.stringify({ googleAccessToken: "real" }) });
  assert.equal(res.status, 409);
});
