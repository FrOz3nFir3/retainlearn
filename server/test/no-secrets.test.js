// Responses never carry what's private about people (P0-06): password hashes, study progress, or other people's
// email addresses. Every read that shows who wrote, edited, suggested or reviews something is checked, logged in as
// someone who may see it.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";

let t;
let ada; // the study set's author and reviewer
before(async () => {
  t = await startApi();
  ada = await t.signIn("ada_author");
});
after(async () => {
  await t?.stop();
});

// What a response must never contain: a bcrypt hash, a password field, progress, or Lee's email (the reads below
// are made as Ada or anonymously, and Lee only appears as a suggester).
function assertNoSecrets(path, body) {
  const text = JSON.stringify(body);
  assert.doesNotMatch(text, /\$2[aby]\$\d\d\$/, `${path}: a password hash`);
  assert.doesNotMatch(text, /"password"/, `${path}: a password field`);
  assert.doesNotMatch(text, /"studying"/, `${path}: someone's progress`);
  assert.doesNotMatch(text, /lee@example\.test/, `${path}: another person's email`);
}

const reads = [
  ["/api/card/" + ids.js, false],
  ["/api/card/" + ids.js + "?view=review", false],
  ["/api/card/" + ids.js + "?view=quiz", false],
  ["/api/card/" + ids.js + "?view=review-queue", true],
  ["/api/card/" + ids.js + "/logs?page=1", false],
  ["/api/card/" + ids.js + "/review-queue?page=1", true],
  ["/api/card/" + ids.js + "/reviewers", true],
  ["/api/cards/Programming?page=1", false],
  ["/api/cards/categories?page=1", false],
  ["/api/users/ada_author", false],
  ["/api/users/lee_learner", false],
  ["/api/users/ada_author/cards?page=1", false],
  ["/api/users/search?id=" + ids.js + "&search=lee&page=1", true],
];

for (const [path, signedIn] of reads) {
  test(`${path}${signedIn ? " (signed in)" : ""} shows no private details`, async () => {
    const res = await t.api(path, signedIn ? { headers: ada } : undefined);
    assert.ok(res.status < 500, `${path}: ${res.status}`);
    assertNoSecrets(path, await res.json());
  });
}
