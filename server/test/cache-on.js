// Loaded first by the cache tests (P0-08), before the app reads its settings: the server's Redis cache is on for
// their run. setup-env.js turns it off for every other test file.
import "./setup-env.js";

process.env.REDIS_CACHE_ENABLED = "true";
