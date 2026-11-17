// The spam guard for study sets (P0-14). A new account's sets start unlisted (not in the categories, the category
// pages or the sitemap, and marked for search engines not to index) until the account is trusted. New accounts create
// fewer sets a day. Links in content are marked nofollow. "Report this set" unlists a set once enough people report
// it. Ada and Lee (fixtures) count as established accounts: their fixed ids date from 1970.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { ids, PASSWORD } from "./fixtures.js";
import Users from "../src/models/users/users.mongo.js";
import Cards from "../src/models/cards/cards.mongo.js";
import SetReport from "../src/models/reports/setReports.mongo.js";
import { sanitizeHTML } from "../src/utils/dom.js";
import { TRUST } from "../src/config/trust.config.js";

let t;
let ada;
let lee;
let fresh; // an account made today
before(async () => {
  t = await startApi();
  await Users.create([
    { username: "fresh_account", email: "fresh@example.test", name: "Fresh Account", password: PASSWORD },
    { username: "third_person", email: "third@example.test", name: "Third Person", password: PASSWORD },
  ]);
  ada = await t.signIn("ada_author");
  lee = await t.signIn("lee_learner");
  fresh = await t.signIn("fresh_account");
});
after(async () => {
  await t?.stop();
});

const createSet = (who, mainTopic, category) =>
  t.api("/api/cards", { method: "POST", headers: who, body: JSON.stringify({ mainTopic, subTopic: "Basics", category }) });
const categories = async () => (await (await t.api("/api/cards/categories?page=1")).json()).categories.map((c) => c.category);
const setsIn = async (category) => (await (await t.api(`/api/cards/${category}?page=1`)).json()).total;
const sitemap = async () => (await t.api("/api/sitemap.xml")).text();
const overview = async (id) => (await t.api(`/api/card/${id}`)).json();

let freshSetId;

test("a new account's set starts unlisted: not in the lists or the sitemap, and not to be indexed", async () => {
  const res = await createSet(fresh, "Atoms", "Chemistry");
  assert.equal(res.status, 200);
  const created = await res.json();
  freshSetId = created._id;
  assert.equal(created.listed, false);
  const days = (new Date(created.listAt) - Date.now()) / (24 * 60 * 60 * 1000);
  assert.ok(days > TRUST.NEW_ACCOUNT_DAYS - 1 && days <= TRUST.NEW_ACCOUNT_DAYS, `listed in ${days} days`);

  assert.ok(!(await categories()).includes("Chemistry"));
  assert.equal(await setsIn("Chemistry"), 0);
  const xml = await sitemap();
  assert.ok(!xml.includes(freshSetId) && !xml.includes("/category/Chemistry"));

  // Its own page still opens (a direct link works), and says it isn't listed.
  const page = await overview(freshSetId);
  assert.equal(page.listed, false);
});

test("an established account's set is listed at once", async () => {
  const res = await createSet(ada, "Motion", "Physics");
  assert.equal(res.status, 200);
  const created = await res.json();
  assert.ok((await categories()).includes("Physics"));
  assert.ok((await sitemap()).includes(created._id));
  assert.equal((await overview(created._id)).listed, true);
  assert.equal((await overview(ids.js)).listed, true, "sets from before the field existed count as listed");
});

test("a new account's set is listed by itself once the account is trusted", async () => {
  await Cards.updateOne({ _id: freshSetId }, { $set: { listAt: new Date(Date.now() - 1000) } });
  assert.ok((await categories()).includes("Chemistry"));
  assert.equal(await setsIn("Chemistry"), 1);
  assert.ok((await sitemap()).includes(freshSetId));
  assert.equal((await overview(freshSetId)).listed, true);
});

test(`a new account can create ${TRUST.SETS_PER_DAY_NEW_ACCOUNT} sets a day`, async () => {
  for (let i = 2; i <= TRUST.SETS_PER_DAY_NEW_ACCOUNT; i++) {
    assert.equal((await createSet(fresh, `Topic ${i}`, "Chemistry")).status, 200);
  }
  const over = await createSet(fresh, "One too many", "Chemistry");
  assert.equal(over.status, 429);
});

test("links in what people write are marked nofollow ugc", () => {
  const html = sanitizeHTML('<p>See <a href="https://example.com/offer">this</a></p>');
  assert.match(html, /<a href="https:\/\/example\.com\/offer" rel="nofollow ugc noopener noreferrer">/);
});

test("reporting a set: one report per person, a reason, a login, and not your own set", async () => {
  const report = (who, body) =>
    t.api(`/api/card/${ids.js}/report`, { method: "POST", headers: who, body: JSON.stringify(body) });

  assert.equal((await report(lee, { reason: "spam", note: "Links to a shop" })).status, 200);
  assert.equal((await report(lee, { reason: "offensive" })).status, 200, "reporting again changes nothing");
  assert.equal(await SetReport.countDocuments({ card: ids.js }), 1);
  assert.equal((await SetReport.findOne({ card: ids.js }).lean()).reason, "spam");

  assert.equal((await report(lee, { reason: "because" })).status, 400);
  assert.equal((await report(ada, { reason: "spam" })).status, 400, "the author can't report their own set");
  const anonymous = await t.api(`/api/card/${ids.js}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "spam" }),
  });
  assert.equal(anonymous.status, 401);
});

test(`a set reported by ${TRUST.REPORTS_TO_UNLIST} people is unlisted until it's checked`, async () => {
  assert.equal(TRUST.REPORTS_TO_UNLIST, 3, "this test reports with three accounts");
  const third = await t.signIn("third_person");
  const report = (who) => t.api(`/api/card/${ids.js}/report`, { method: "POST", headers: who, body: JSON.stringify({ reason: "spam" }) });

  // Lee reported above; Fresh makes two.
  assert.equal((await report(fresh)).status, 200);
  assert.ok((await categories()).includes("Programming"), "two reports aren't enough");

  assert.equal((await report(third)).status, 200);
  assert.ok(!(await categories()).includes("Programming"));
  assert.ok(!(await sitemap()).includes(ids.js.toString()));
  const card = await Cards.findById(ids.js).lean();
  assert.equal(card.listed, false);
  assert.equal(card.listAt, undefined, "it waits to be listed by hand");

  // A new account's set that's reported before its day to be listed isn't listed by itself any more.
  const waiting = await Cards.create({
    "main-topic": "Waiting",
    "sub-topic": "Basics",
    category: "Chemistry",
    author: (await Users.findOne({ username: "fresh_account" }).lean())._id,
    listed: false,
    listAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  for (const who of [lee, ada, third]) {
    const res = await t.api(`/api/card/${waiting._id}/report`, { method: "POST", headers: who, body: JSON.stringify({ reason: "spam" }) });
    assert.equal(res.status, 200);
  }
  assert.equal((await Cards.findById(waiting._id).lean()).listAt, undefined);
});
