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
    const server = app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
      console.log(
        `Backend Server with PID:${process.pid} started in ${Date.now() - localStartTime
        }ms`
      );
      // Database migrations, once the server is answering requests. They never stop it (src/migrations/runner.js).
      runAtStartup(mongoose.connection.db);
    });

    // Stopping cleanly when asked (a deploy, `docker stop`, Ctrl+C). In the container the server is process 1, which
    // ignores a stop signal it doesn't handle, so a deploy would wait 10 seconds and then kill it. Instead: stop taking
    // new requests, let the ones in progress finish (5 seconds at most), and exit.
    for (const signal of ["SIGTERM", "SIGINT"]) {
      process.once(signal, () => {
        console.log(`${signal}: closing the server`);
        server.close(() => process.exit(0));
        server.closeIdleConnections();
        setTimeout(() => process.exit(0), 5000).unref();
      });
    }
  } catch (err) {
    console.error(`Server startup failed:`, err.message);
    process.exit(1); // Exit if worker fails to start
  }
}

startServer();
