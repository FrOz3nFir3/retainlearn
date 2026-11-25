import "./cache-on.js"; // first: the cache is on for this file
// With the server's Redis cache on: a cached response only ever goes to someone allowed to see it (P0-08), and the
// review queue needs a login (P0-09). Each check fills the cache as one user, then asks again as another.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";
import { cacheService } from "../src/services/cache.js";

let t;
let ada; // the study set's author and reviewer
let lee; // signed in, but not a reviewer
before(async () => {
  t = await startApi();
  assert.ok(await cacheService.checkRedisConnection(), "the cache is on for these tests");
  ada = await t.signIn("ada_author");
  lee = await t.signIn("lee_learner");
});
after(async () => {
  await t?.stop();
});

const get = (path, headers) => t.api(path, headers ? { headers } : undefined);

// Asks until the answer comes from the cache (it's stored just after replying), and returns the first answer.
async function getAndCache(path, headers) {
  const first = await get(path, headers);
  for (let i = 0; i < 40; i++) {
    const again = await get(path, headers);
    if (again.headers.get("x-cache") === "HIT") return first;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`${path} was never cached`);
}

test("the reviewer list, cached for a reviewer, isn't served to someone who isn't one", async () => {
  const path = `/api/card/${ids.js}/reviewers`;
  assert.equal((await getAndCache(path, ada)).status, 200);
  assert.equal((await get(path, lee)).status, 403);
});

test("the reviewer search, cached for a reviewer, isn't served to someone who isn't one", async () => {
  const path = `/api/users/search?id=${ids.js}&search=lee&page=1`;
  assert.equal((await getAndCache(path, ada)).status, 200);
  assert.equal((await get(path, lee)).status, 403);
});

test("the review queue needs a login, even when it's cached", async () => {
  for (const path of [`/api/card/${ids.js}/review-queue?page=1`, `/api/card/${ids.js}?view=review-queue`]) {
    assert.equal((await getAndCache(path, ada)).status, 200, path);
    assert.equal((await get(path)).status, 401, path);
  }
  // The set itself stays public.
  assert.equal((await get(`/api/card/${ids.js}`)).status, 200);
});

test("query parameters the server doesn't read don't make new cache entries", async () => {
  await getAndCache("/api/cards/categories?page=1&utm_source=a");
  const other = await get("/api/cards/categories?page=1&utm_source=b");
  assert.equal(other.headers.get("x-cache"), "HIT");
});

test("responses for signed-in users are marked private, so shared caches never keep them", async () => {
  const res = await get(`/api/card/${ids.js}/reviewers`, ada);
  assert.match(res.headers.get("cache-control"), /\bprivate\b/);
});
