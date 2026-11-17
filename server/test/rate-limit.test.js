// The rate limits (P0-10): they count each visitor by an address the visitor can't make up, and a "strike" (one time
// over a limit) is remembered for 12 hours.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";
import { redis } from "../src/services/redis.js";
import { getClientIp } from "../src/middleware/rateLimiter.middleware.js";
import env from "../src/config/env.js";

let t;
before(async () => {
  t = await startApi();
});
after(async () => {
  await t?.stop();
});

test("a strike is remembered for 12 hours, not 500 days", async () => {
  // Sign-ins allow 10 tries per 15 minutes; the 11th is over the limit and earns a strike.
  let last;
  for (let i = 0; i < 11; i++) {
    last = await t.api("/api/user/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  }
  assert.equal(last.status, 429);

  const keys = await redis.keys("*");
  assert.ok(keys.some((key) => key.startsWith("strikes:")), `a strike was recorded (keys: ${keys.join(", ")})`);
  for (const key of keys) {
    const seconds = await redis.ttl(key);
    assert.ok(seconds > 0 && seconds <= 12 * 60 * 60, `${key} lasts ${seconds} s`);
  }
});

// The visitor's address. Unit checks: the setting behind Cloudflare (ENABLE_PROXY) is switched on just for them.
const request = (headers) => ({ headers, ip: "10.0.0.2", socket: { remoteAddress: "10.0.0.2" } });
function behindCloudflare(check) {
  const before = env.ENABLE_PROXY;
  env.ENABLE_PROXY = true;
  try {
    check();
  } finally {
    env.ENABLE_PROXY = before;
  }
}

test("behind Cloudflare, the visitor is the address Cloudflare reports", () =>
  behindCloudflare(() => {
    const req = request({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1, 203.0.113.7" });
    assert.equal(getClientIp(req), "203.0.113.7");
  }));

test("an X-Forwarded-For the visitor wrote doesn't make them a new visitor", () =>
  behindCloudflare(() => {
    assert.equal(getClientIp(request({ "x-forwarded-for": "198.51.100.99" })), "10.0.0.2");
    assert.equal(getClientIp(request({ "cf-connecting-ip": "not an address" })), "10.0.0.2");
  }));

test("without a proxy in front, the visitor is the address that connected", () => {
  assert.equal(env.ENABLE_PROXY, false);
  assert.equal(getClientIp(request({ "cf-connecting-ip": "203.0.113.7" })), "10.0.0.2");
});
