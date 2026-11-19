/**
 * Environment Configuration
 * 
 * Centralized environment variable management.
 * Load dotenv once and export all environment variables.
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables. `.env.local` (git-ignored; see `.env.local.example`) loads first and wins, because
// dotenv never overrides a value that's already set: it points a local server at local databases, so development
// never touches production's. Then `.env`. Production has neither file in the repo: Dokploy sets its variables.
dotenv.config({ path: join(__dirname, "../../../.env.local"), quiet: true });
dotenv.config({ path: join(__dirname, "../../../.env"), quiet: true });

/**
 * Environment variables with defaults and validation
 * Variable names match sample.env exactly
 */
export const env = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3000", 10),

    // Authentication & Security
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",
    COOKIE_SECRET: process.env.COOKIE_SECRET || "",

    // Database
    MONGO_URI: process.env.MONGO_URI || "",

    // Redis
    REDIS_URI: process.env.REDIS_URI || "",
    // Cache Configuration
    REDIS_CACHE_ENABLED: process.env.REDIS_CACHE_ENABLED !== "false", // Default: true
    REDIS_CACHE_DEBUG_ENABLED: process.env.REDIS_CACHE_DEBUG_ENABLED === "true", // Default: false


    // Rate Limiting
    WHITELIST_IP: process.env.WHITELIST_IP?.split(",") || [],

    // Proxy Configuration
    ENABLE_PROXY: process.env.ENABLE_PROXY !== "false", // Default: true

    // Google sign-in: the OAuth client id that Google's tokens must have been issued for (checked on the server,
    // services/googleAuth.js). It's public, the same one the client uses (VITE_GOOGLE_CLIENT_ID), so it defaults to
    // the client's built-in one.
    GOOGLE_CLIENT_ID:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.VITE_GOOGLE_CLIENT_ID ||
        "861201461365-j2s71jmj0i3q5qo2634mfbavoepi53to.apps.googleusercontent.com",
};

/**
 * Validate required environment variables
 */
export function validateEnv() {
    const required = [
        "MONGO_URI",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "COOKIE_SECRET",
    ];

    const missing = required.filter((key) => !env[key]);

    if (missing.length > 0) {
        console.error(
            `❌ Missing required environment variables: ${missing.join(", ")}`
        );
        if (env.NODE_ENV === "production") {
            process.exit(1);
        }
    }
}

// Validate on import
validateEnv();

export default env;
