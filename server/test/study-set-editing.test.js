// Editing a study set through today's endpoints (PATCH /api/card, its reviewers and its review queue). Only that
// set's reviewers manage its reviewers and accept or reject its suggested changes: being a reviewer of another set
// (every author reviews their own) gives no rights on this one, whatever the request carries. And a new order of its
// flashcards or questions can't lose any.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids } from "./fixtures.js";

let t;
let ada; // the JavaScript set's author, so its reviewer
let lee; // the author of a set of his own, and no reviewer of Ada's
let leeSet;
let suggestion; // a change suggested to Ada's set, waiting for review
before(async () => {
  t = await startApi();
  ada = await t.signIn("ada_author");
  lee = await t.signIn("lee_learner");
  const made = await t.api("/api/cards", { method: "POST", headers: lee, body: JSON.stringify({ mainTopic: "Verbs", subTopic: "Basics", category: "Spanish" }) });
  assert.equal(made.status, 200);
  leeSet = (await made.json())._id;
  const queue = await (await t.api(`/api/card/${ids.js}?view=review-queue`, { headers: ada })).json();
  suggestion = queue.reviewQueue[0]._id;
});
after(async () => {
  await t?.stop();
});

const send = (method, path, who, body) => t.api(path, { method, headers: who, body: body ? JSON.stringify(body) : undefined });
const reviewersOf = async (set) => (await (await t.api(`/api/card/${set}/reviewers`, { headers: ada })).json()).reviewers.map((r) => r.username);

test("a reviewer of another set can't add or remove this set's reviewers", async () => {
  assert.equal((await send("POST", `/api/card/${ids.js}/reviewers`, lee, { usernames: ["lee_learner"] })).status, 403);
  assert.equal((await send("POST", `/api/card/${ids.js}/reviewers`, lee, { _id: leeSet, usernames: ["lee_learner"] })).status, 403);
  assert.equal((await send("DELETE", `/api/card/${ids.js}/reviewers/ada_author`, lee, { _id: leeSet })).status, 403);
  assert.deepEqual(await reviewersOf(ids.js), ["ada_author"]);
});

test("a reviewer of another set can't accept or reject this set's suggestions", async () => {
  for (const action of ["accept", "reject"]) {
    const path = `/api/card/${ids.js}/review-queue/${suggestion}/${action}`;
    assert.equal((await send("POST", path, lee)).status, 403, action);
    assert.equal((await send("POST", path, lee, { _id: leeSet })).status, 403, `${action}, naming another set`);
  }
  const queue = await (await t.api(`/api/card/${ids.js}?view=review-queue`, { headers: ada })).json();
  assert.deepEqual(
    queue.reviewQueue.map((item) => item._id),
    [suggestion],
    "the suggestion is still waiting",
  );
});

test("a save is checked against the set it saves to: applied for its reviewers, suggested for anyone else", async () => {
  const save = async (who, set) => (await send("PATCH", "/api/card", who, { _id: set, description: "<p>Edited</p>" })).json();
  assert.equal((await save(ada, ids.js)).reviewQueue, undefined, "Ada reviews her own set");
  assert.equal((await save(lee, leeSet)).reviewQueue, undefined, "Lee reviews his own set");
  assert.equal((await save(lee, ids.js)).reviewQueue, true, "Lee's change to Ada's set waits for review");
});

test("a new order that names a flashcard twice is ignored, so none is lost", async () => {
  const order = async () => (await (await t.api(`/api/card/${ids.js}?view=review`)).json()).review.map((card) => card._id);
  const [first, second] = [String(ids.constCard), String(ids.loopCard)];
  assert.deepEqual(await order(), [first, second]);
  assert.equal((await send("PATCH", "/api/card", ada, { _id: ids.js, reorderFlashcards: [first, first] })).status, 200);
  assert.deepEqual(await order(), [first, second]);
  assert.equal((await send("PATCH", "/api/card", ada, { _id: ids.js, reorderFlashcards: [second, first] })).status, 200);
  assert.deepEqual(await order(), [second, first]);
});

test("a set's own reviewers still manage it", async () => {
  assert.equal((await send("POST", `/api/card/${leeSet}/reviewers`, lee, { usernames: ["ada_author"] })).status, 200);
  assert.deepEqual((await reviewersOf(leeSet)).sort(), ["ada_author", "lee_learner"]);
  assert.equal((await send("DELETE", `/api/card/${leeSet}/reviewers/ada_author`, lee)).status, 200);
  assert.equal((await send("POST", `/api/card/${ids.js}/review-queue/${suggestion}/reject`, ada)).status, 200);
});
