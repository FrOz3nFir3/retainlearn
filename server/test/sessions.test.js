// Signing in and sessions (P0-10, P0-13). Only text is looked up as a sign-in name. A refresh renews the whole
// session. Logging out ends the account's sessions everywhere, and sessions from before this change keep working.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { cookiesOf, startApi } from "./helpers.js";
import { ids, PASSWORD } from "./fixtures.js";

let t;
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});

const post = (path, init = {}) => t.api(path, { method: "POST", ...init });
const refresh = (cookie) => post("/api/user/refresh", { headers: { Cookie: cookie } });
const setsCookie = (res, name) => res.headers.getSetCookie().some((cookie) => cookie.startsWith(`${name}=`) && !/Expires=Thu, 01 Jan 1970/.test(cookie));

test("a sign-in name that isn't text is refused, not run as a query", async () => {
  // { $ne: null } matches every account, so it used to sign in as the first one whose password matched.
  const res = await post("/api/user/login", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginIdentifier: { $ne: null }, password: PASSWORD }),
  });
  assert.equal(res.status, 400);
  assert.equal(res.headers.getSetCookie().length, 0);
});

test("a refresh renews the session: new access, refresh and CSRF tokens", async () => {
  const session = await t.signIn("ada_author");
  const res = await refresh(session.Cookie);
  assert.equal(res.status, 200);
  assert.ok((await res.json()).csrfToken);
  for (const name of ["jwt_access", "jwt_refresh", "csrf_token"]) assert.ok(setsCookie(res, name), name);
});

test("logging out ends the account's sessions on every device", async () => {
  const laptop = await t.signIn("lee_learner");
  const phone = await t.signIn("lee_learner");

  const res = await post("/api/user/logout", { headers: laptop });
  assert.equal(res.status, 200);

  const phoneRefresh = await refresh(phone.Cookie);
  assert.equal(phoneRefresh.status, 401);
  assert.ok(phoneRefresh.headers.getSetCookie().some((cookie) => cookie.startsWith("jwt_refresh=;")), "its cookies are cleared");
  assert.equal((await refresh(laptop.Cookie)).status, 401, "a copy of the laptop's cookies doesn't work either");

  // Signing in again starts a new session.
  const again = await t.signIn("lee_learner");
  assert.equal((await refresh(again.Cookie)).status, 200);
});

test("a session from before token versions keeps working (no one is signed out by the deploy)", async () => {
  // A refresh token as the old code made it, with no version, in a signed cookie as Express signs them.
  const token = jwt.sign({ id: ids.author }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
  const signature = crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(token).digest("base64").replace(/=+$/, "");
  const res = await refresh(`jwt_refresh=${encodeURIComponent(`s:${token}.${signature}`)}`);
  assert.equal(res.status, 200);

  // The renewed session works like any other.
  const renewed = await refresh(cookiesOf(res));
  assert.equal(renewed.status, 200);
});
