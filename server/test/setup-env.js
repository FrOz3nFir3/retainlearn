// The tests' own settings, loaded before the app. dotenv never overrides a value that's already set, so these win
// over .env.local and .env.
// - MongoDB: a local database only for tests, `retainlearn_test`, dropped at the start of each run (helpers.js).
// - Redis: database 1, so tests and development (database 0) never share cached responses. The cache stays off in
//   these first tests; the cache-safety tests (P0-08) turn it on for their own runs.
process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.TEST_MONGO_URI ?? "mongodb://localhost:27017/retainlearn_test";
process.env.REDIS_URI = process.env.TEST_REDIS_URI ?? "redis://localhost:6379/1";
process.env.REDIS_CACHE_ENABLED = "false";
process.env.ENABLE_PROXY = "false";
process.env.ACCESS_TOKEN_SECRET = "test-access-token-secret";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret";
process.env.COOKIE_SECRET = "test-cookie-secret";
