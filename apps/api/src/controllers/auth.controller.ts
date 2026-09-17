import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { RegisterUserSchema, LoginUserSchema } from "@systemcraft/shared";
import { ENV } from "../config/env.js";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterUserSchema.parse(req.body);
      const existingUser = await User.findOne({ email: validated.email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: "USER_EXISTS", message: "User with this email already exists" }
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(validated.password, salt);

      const user = await User.create({
        name: validated.name,
        email: validated.email,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validated.name)}`
      });

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, name: user.name },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginUserSchema.parse(req.body);
      const user = await User.findOne({ email: validated.email });
      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
        });
        return;
      }

      const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
        });
        return;
      }

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, name: user.name },
        ENV.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("token");
    res.json({ success: true, data: { message: "Logged out successfully" } });
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }
      const user = await User.findById(req.user.id).select("-passwordHash");
      if (!user) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
        return;
      }
      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
