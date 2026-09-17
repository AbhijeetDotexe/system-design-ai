import mongoose from "mongoose";
import { ENV } from "./env.js";

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully to ${ENV.MONGODB_URI}`);
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    process.exit(1);
  }
}
