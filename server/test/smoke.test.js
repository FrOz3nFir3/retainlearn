// The first API tests (P0-04): the harness itself, against real routes. The security fixes add their tests here.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";

let t;
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});

test("the health check answers", async () => {
  const res = await t.api("/api/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("the categories list the made-up sets' subjects", async () => {
  const res = await t.api("/api/cards/categories?page=1");
  assert.equal(res.status, 200);
  const listed = JSON.stringify((await res.json()).categories);
  assert.match(listed, /Programming/);
  assert.match(listed, /Biology/);
});

test("a study set's overview opens", async () => {
  const res = await t.api(`/api/card/${ids.js}`);
  assert.equal(res.status, 200);
  assert.match(JSON.stringify(await res.json()), /Fundamentals/);
});

test("your report card needs a login", async () => {
  const res = await t.api("/api/report-card?tz=UTC");
  assert.equal(res.status, 401);
});
