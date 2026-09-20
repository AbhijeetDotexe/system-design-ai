import dotenv from "dotenv";
import path from "path";

dotenv.config();

function parseApiKeys(): string[] {
  const rawKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY,
  ] as const;
  const keys = rawKeys.filter((k): k is string => typeof k === "string" && k.length > 10);
  return keys.length > 0 ? keys : [process.env.GEMINI_API_KEY || ""];
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/systemcraft",
  JWT_SECRET: process.env.JWT_SECRET || "systemcraft_super_secret_jwt_key_98765",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GEMINI_API_KEYS: parseApiKeys(),
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  OPENROUTER_MODELS: (process.env.OPENROUTER_MODELS || "nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free").split(",").map(m => m.trim()).filter(Boolean),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "pk_test_bWFpbi1seW54LTc3LmNsZXJrLmFjY291bnRzLmRldiQ",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || ""
};
