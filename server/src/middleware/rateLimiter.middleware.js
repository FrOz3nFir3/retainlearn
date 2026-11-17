import rateLimit, { MemoryStore } from "express-rate-limit";
import { isIP } from "node:net";
import { LRUCache } from "lru-cache";
import { redis, redisConnect } from "../services/redis.js";
import { RedisStore } from "rate-limit-redis";
import env from "../config/env.js";

try {
  await redisConnect();
} catch { }

console.log(
  !redis.isReady
    ? `Redis not connected using Memory Store with lru cache for rate limiter`
    : `Redis connected to rate limiter`
);

// The visitor's address, which the limits below count by (P0-10).
// - Behind Cloudflare (ENABLE_PROXY), it's the CF-Connecting-IP header. Cloudflare sets it on every request and
//   replaces any value the visitor sent. X-Forwarded-For can't be used: its first entries are whatever the visitor
//   wrote, so it could look like a new visitor on every request.
// - Otherwise, the address that connected (Express's req.ip).
// The header only counts if the request came through Cloudflare. Requests that reach the server directly could set it
// to anything, so the server should only accept connections from Cloudflare.
export const getClientIp = (req) => {
  if (env.ENABLE_PROXY) {
    const visitor = req.headers["cf-connecting-ip"];
    if (typeof visitor === "string" && isIP(visitor)) return visitor;
  }
  return req.ip ?? req.socket.remoteAddress;
};

// How long a "strike" (one time over a limit) is remembered. Redis takes seconds and the memory store milliseconds:
// passing the milliseconds to Redis once kept strikes for about 500 days.
const STRIKE_TTL_SECONDS = 12 * 60 * 60; // 12 hours
const GLOBAL_ABUSE_THRESHOLD = 1000; // How many times an IP can get rate-limited before a long-term block.
const AUTH_ABUSE_THRESHOLD = 10;

// --- A Memory-Safe Store for Abusive IPs ---
// This cache will automatically evict the least recently used IPs
// if it reaches its size limit, preventing a memory leak.
// It will also automatically evict entries after their TTL (Time To Live).
const abuseTracker = new LRUCache({
  max: 100000, // A single, larger cache for all abuse tracking.
  // The TTL here is for how long a "strike" is remembered.
  ttl: STRIKE_TTL_SECONDS * 1000,
});

// Strikes are counted separately for sign-ins and for the API as a whole, under their own names in Redis.
const authStrikeKey = (key) => `strikes:auth:${key}`;
const apiStrikeKey = (key) => `strikes:api:${key}`;

async function getStrikes(key) {
  return redis.isReady ? Number(await redis.get(key)) : abuseTracker.get(key) || 0;
}

async function addStrike(key) {
  const strikes = (await getStrikes(key)) + 1;
  if (redis.isReady) {
    await redis.set(key, String(strikes), { EX: STRIKE_TTL_SECONDS });
  } else {
    abuseTracker.set(key, strikes);
  }
  return strikes;
}

// Rate limiter for sensitive authentication actions like login and registration
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req, res) => {
    const strikes = await getStrikes(authStrikeKey(getClientIp(req)));
    // If this user/IP has reached the abuse threshold, block them.
    if (strikes >= AUTH_ABUSE_THRESHOLD) {
      return -1; // The "Penalty Box" logic.
    }

    return 10; // Limit each IP to 10 requests per windowMs
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req, res, next, options) => {
    // Increment the strike count for this user/IP.
    const strikeCount = await addStrike(authStrikeKey(options.keyGenerator(req)));

    if (strikeCount >= AUTH_ABUSE_THRESHOLD) {
      // On the final strike, send a harsher message.
      return res.status(options.statusCode).json({
        error:
          "Access has been temporarily restricted due to excessive requests. Please try again later.",
      });
    }

    // Send the standard "soft" rate-limit message.
    res.status(options.statusCode).json({ error: options.message.error });
  },
  keyGenerator: getClientIp,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  store: redis.isReady
    ? new RedisStore({
      // Its own counts. With the default prefix it shared each visitor's count with globalApiLimiter, so browsing
      // while logged out used up the sign-in limit.
      prefix: "rl:auth:",
      sendCommand: (...args) => {
        // edge case left to handle later
        if (!redis.isReady) return [];
        try {
          return redis.sendCommand(args);
        } catch (e) {
          // fail silently?
        }
      },
    })
    : new MemoryStore(),
});

// A more general rate limiter authenticated API endpoints
export const globalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1-minute window
  skip: (req) => {
    const key = getClientIp(req);
    const whiteListIp = env.WHITELIST_IP;
    return whiteListIp.includes(key);
  },
  max: async (req, res) => {
    const strikes = await getStrikes(apiStrikeKey(req.token ? req.token.id : getClientIp(req)));
    // If this user/IP has reached the abuse threshold, block them.
    if (strikes >= GLOBAL_ABUSE_THRESHOLD) {
      return -1; // The "Penalty Box" logic.
    }

    return req.token ? 500 : 250; // Standard limits for everyone else.
  },
  keyGenerator: (req, res) => {
    return req.token ? req.token.id : getClientIp(req);
  },
  handler: async (req, res, next, options) => {
    // Increment the strike count for this user/IP.
    const strikeCount = await addStrike(apiStrikeKey(options.keyGenerator(req)));

    if (strikeCount >= GLOBAL_ABUSE_THRESHOLD) {
      // On the final strike, send a harsher message.
      return res.status(options.statusCode).json({
        error:
          "Access has been temporarily restricted due to excessive requests. Please try again later.",
      });
    }

    // Send the standard "soft" rate-limit message.
    res.status(options.statusCode).json({ error: options.message.error });
  },
  message: {
    error: "You are making requests too quickly. Please slow down.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: redis.isReady
    ? new RedisStore({
      prefix: "rl:api:", // its own counts, apart from sign-ins (authLimiter)
      sendCommand: (...args) => {
        // edge case left to handle later
        if (!redis.isReady) return [];
        try {
          return redis.sendCommand(args);
        } catch (e) {
          // fail silently?
        }
      },
    })
    : new MemoryStore(),
});

const ddosCache = new LRUCache({
  max: 50000,     
  ttl: 60 * 1000,  // 1 Minute only.
});

export const ddosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // High limit: 1000 reqs/min per IP. 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: { error: "Too many requests. Please wait." },
  store: {
    init: () => {},
    get: async (key) => {
      const hitCount = ddosCache.get(key);
      if (!hitCount) return undefined;
      return { 
        totalHits: hitCount, 
        resetTime: new Date(Date.now() + 60000) 
      };
    },
    increment: async (key) => {
      const current = ddosCache.get(key) || 0;
      const next = current + 1;
      ddosCache.set(key, next);
      return {
        totalHits: next,
        resetTime: new Date(Date.now() + 60000)
      };
    },
    decrement: async (key) => {
       // Optional implementation
    },
    resetKey: async (key) => {
      ddosCache.delete(key);
    },
  },
});