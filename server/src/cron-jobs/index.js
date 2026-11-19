import { cleanupExpiredReviewItems } from "../models/cards/cards.model.js";
import { initMongoDB } from "../services/mongo.js";

// Execute the cleanup function - cron jobs time and execution handled externally
async function runCleanup() {
    try {
        // Connect to MongoDB first
        await initMongoDB();
        console.log("MongoDB connected");

        // Run the cleanup
        await cleanupExpiredReviewItems();
        process.exit(0);
    } catch (error) {
        // Say why, so a failed run in Dokploy's logs isn't a silent exit code.
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

runCleanup();

