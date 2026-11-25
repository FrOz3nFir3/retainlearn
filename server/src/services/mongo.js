import mongoose from "mongoose";
import { setServers } from "node:dns/promises";
import env from "../config/env.js";

// Set DNS servers for faster MongoDB Atlas resolution
setServers(["1.1.1.1", "8.8.8.8"]);

// MongoDB connection string from environment
const MONGO_URI = env.MONGO_URI;

// Where it connects, without the user and password, so a local run shows plainly that it isn't production.
const where = (uri) => (uri || "(no MONGO_URI set)").replace(/\/\/[^@/]*@/, "//").split("?")[0];

mongoose.connection.once("open", () => {
  console.log("MongoDB connection ready!");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

export async function mongoConnect() {
  // Skip if already connected
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return;
  }

  // Connect to MongoDB
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 100,
    minPoolSize: 10,
    compressors: "zlib",
    bufferCommands: false, // Don't buffer commands if not connected
    maxIdleTimeMS: 900000, // 15 minutes
    // Indexes and collections come from the migrations (src/migrations), not from Mongoose at every start: each one
    // is made once, recorded, and checked beforehand with `npm run check:data`. A collection with no migration is
    // made by its first insert.
    autoIndex: false,
    autoCreate: false,
  });
}

export async function mongoDisconnect() {
  await mongoose.disconnect();
}

// Initialize MongoDB connection with timing and error handling
export const initMongoDB = async () => {
  const startTime = Date.now();

  try {
    console.log(`Initializing MongoDB connection to ${where(MONGO_URI)} ...`);
    await mongoConnect();

    if (mongoose.connection.readyState === 1) {
      console.log(`MongoDB ready in ${Date.now() - startTime}ms`);
    }
  } catch (err) {
    console.error(
      `MongoDB connection failed after ${Date.now() - startTime}ms:`,
      err.message
    );
    // Fail fast: a server without its database only looks like it's running (every request fails instead).
    // server.js and the cron job exit on this.
    throw err;
  }
};

// Get current connection status
export const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return {
    state: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState],
    isConnected: mongoose.connection.readyState === 1,
  };
};
