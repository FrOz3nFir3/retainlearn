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
  ["/api/subjects/Programming", false],
  ["/api/subjects?page=1", false],
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

test("the reviewer search finds an email only from the whole address, never from part of it", async () => {
  const found = async (search) => {
    const res = await t.api(`/api/users/search?id=${ids.js}&search=${encodeURIComponent(search)}&page=1`, { headers: ada });
    return (await res.json()).users.map((user) => user.username);
  };
  assert.deepEqual(await found("lee@example"), []);
  assert.deepEqual(await found("example.test"), []);
  assert.deepEqual(await found("LEE@example.test"), ["lee_learner"]);
  assert.deepEqual(await found("learner"), ["lee_learner"], "names and usernames still match any part");
});

test("a public profile is a name, a username and the subjects of the sets they made; your own session says when you joined", async () => {
  const res = await t.api("/api/users/ada_author");
  assert.deepEqual(await res.json(), { name: "Ada Author", username: "ada_author", subjects: ["Biology", "Programming"] });
  const lee = await (await t.api("/api/users/lee_learner")).json();
  assert.deepEqual(lee.subjects, [], "no sets made, no subjects");
  const me = await (await t.api("/api/user/authed", { method: "POST", headers: ada })).json();
  assert.ok(!Number.isNaN(Date.parse(me.user.joinedAt)), "joinedAt is a date");
});
