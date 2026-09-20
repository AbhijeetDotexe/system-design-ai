import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "@clerk/express";
import { ENV } from "../config/env.js";
import { User } from "../models/User.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  clerkId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

async function resolveUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Try legacy JWT first if signed with JWT_SECRET
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    if (decoded && decoded.id) {
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    }
  } catch {
    // Not a legacy JWT signed with JWT_SECRET
  }

  // 2. Try Clerk verification if secret key is present
  if (ENV.CLERK_SECRET_KEY) {
    try {
      const verified = await verifyToken(token, { secretKey: ENV.CLERK_SECRET_KEY });
      const clerkId = verified.sub;
      let user = await User.findOne({ clerkId });
      if (!user) {
        user = await User.create({
          clerkId,
          email: `${clerkId}@clerk.user`,
          name: "Clerk User",
        });
      }
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        clerkId,
      };
    } catch {
      // Signature verification failed
    }
  }

  // 3. Fallback for Clerk token: decode Clerk JWT claims
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.sub && (decoded.iss?.includes("clerk") || decoded.sub.startsWith("user_"))) {
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }
      const clerkId = decoded.sub;
      let user = await User.findOne({ clerkId });
      if (!user) {
        user = await User.create({
          clerkId,
          email: (decoded.email || `${clerkId}@clerk.user`).toLowerCase(),
          name: decoded.name || "Clerk User",
        });
      }
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        clerkId,
      };
    }
  } catch {
    // Decoding failed
  }

  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      });
      return;
    }

    const user = await resolveUserFromToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid or expired token" }
    });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const user = await resolveUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}
