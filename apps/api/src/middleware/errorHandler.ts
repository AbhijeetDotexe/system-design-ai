import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[ErrorHandler] Error during ${req.method} ${req.path}:`, err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.errors
      }
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const code = err.code || "INTERNAL_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}
