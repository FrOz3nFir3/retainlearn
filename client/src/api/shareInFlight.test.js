// Run with `npm test` in client/ (Node's built-in runner; no browser needed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { shareInFlight } from "./shareInFlight.js";

const later = (value, ms = 10) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

test("calls made while one is running share it", async () => {
  const share = shareInFlight();
  let started = 0;
  const refresh = () => {
    started++;
    return later({ data: { csrfToken: "new" } });
  };
  const results = await Promise.all([share("refresh", refresh), share("refresh", refresh), share("refresh", refresh)]);
  assert.equal(started, 1);
  assert.ok(results.every((result) => result === results[0]));
});

test("once it's finished, the next call starts a new one", async () => {
  const share = shareInFlight();
  let started = 0;
  const refresh = () => later(++started);
  assert.equal(await share("refresh", refresh), 1);
  assert.equal(await share("refresh", refresh), 2);
});

test("a failed call is shared too, and doesn't block the next one", async () => {
  const share = shareInFlight();
  const failing = () => later(null).then(() => Promise.reject(new Error("offline")));
  const both = [share("refresh", failing), share("refresh", failing)];
  for (const call of both) await assert.rejects(call, /offline/);
  assert.equal(await share("refresh", () => "ok"), "ok");
});

test("different keys run separately", async () => {
  const share = shareInFlight();
  let started = 0;
  const call = () => later(++started);
  await Promise.all([share("refresh", call), share("csrf-refresh", call)]);
  assert.equal(started, 2);
});
