import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/systemcraft",
  JWT_SECRET: process.env.JWT_SECRET || "systemcraft_super_secret_jwt_key_98765",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173"
};
