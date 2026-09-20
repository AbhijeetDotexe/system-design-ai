import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { diagramRouter } from "./routes/diagram.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { DiagramController } from "./controllers/diagram.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Trust proxy for Nginx / reverse proxy deployment
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

// CORS configuration
const allowedOrigins = new Set([
  ENV.CLIENT_URL,
  "https://blueprint.abhijeetrana.com",
  "http://blueprint.abhijeetrana.com",
  "http://localhost:5173",
  "http://localhost:3000"
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || origin.endsWith(".abhijeetrana.com") || origin === "https://abhijeetrana.com") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Body parsers & cookies
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

// Request logging
if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting for AI endpoints to prevent abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many AI generation requests, please wait a moment."
    }
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SystemCraft API",
    timestamp: new Date().toISOString()
  });
});

// Public share link route
app.get("/api/share/:token", DiagramController.getByShareToken);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/diagrams", diagramRouter);
app.use("/api/ai", aiLimiter, aiRouter);

// Centralized error handler
app.use(errorHandler);
