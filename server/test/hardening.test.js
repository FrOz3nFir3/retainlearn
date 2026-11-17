// Smaller fixes: the HTTPS redirect stops the request (P0-11), request bodies are capped at 1 MB (P0-12), and the
// history search takes text, not patterns (P0-16).
import { after, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import { redirectToHttps } from "../src/middleware/https.middleware.js";

let t;
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});

test("a plain-HTTP request is redirected to HTTPS and goes no further", () => {
  const res = { redirect: mock.fn() };
  const next = mock.fn();
  redirectToHttps({ secure: false, headers: { host: "api.example.test" }, url: "/api/user/login" }, res, next);
  assert.deepEqual(res.redirect.mock.calls[0].arguments, ["https://api.example.test/api/user/login"]);
  assert.equal(next.mock.callCount(), 0);

  redirectToHttps({ secure: true, headers: {}, url: "/" }, res, next);
  assert.equal(next.mock.callCount(), 1);
});

test("a request body over 1 MB is refused", async () => {
  const body = JSON.stringify({ loginIdentifier: "x".repeat(1.5 * 1024 * 1024), password: "x" });
  const res = await t.api("/api/user/login", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  assert.equal(res.status, 413);
});

const searchLogs = async (search) => {
  const res = await t.api(`/api/card/${ids.js}/logs?page=1&search=${encodeURIComponent(search)}`);
  return { status: res.status, logs: res.status === 200 ? (await res.json()).logs ?? [] : [] };
};

test("the history search finds words as typed", async () => {
  const found = await searchLogs("edited a");
  assert.equal(found.status, 200);
  assert.deepEqual(found.logs.map((log) => log.summary), ["Edited a flashcard"]);
});

test("the history search reads what's typed as text, not as a pattern", async () => {
  // ".*" would match every entry, and "(" is a broken pattern that made the database query fail.
  for (const search of [".*", "(", "(a+)+$"]) {
    const result = await searchLogs(search);
    assert.equal(result.status, 200, search);
    assert.equal(result.logs.length, 0, search);
  }
});
