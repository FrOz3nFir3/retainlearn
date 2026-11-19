import mongoose from "mongoose";
import app from "./app.js";
import { initMongoDB } from "./services/mongo.js";
import { runAtStartup } from "./migrations/runner.js";
import env from "./config/env.js";

const PORT = env.PORT;

async function startServer() {
  const localStartTime = Date.now();

  try {
    // Initialize MongoDB first (blocking)
    await initMongoDB();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
      console.log(
        `Backend Server with PID:${process.pid} started in ${Date.now() - localStartTime
        }ms`
      );
      // Database migrations, once the server is answering requests. They never stop it (src/migrations/runner.js).
      runAtStartup(mongoose.connection.db);
    });
  } catch (err) {
    console.error(`Server startup failed:`, err.message);
    process.exit(1); // Exit if worker fails to start
  }
}

startServer();
