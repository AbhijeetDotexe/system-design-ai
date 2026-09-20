import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.post("/sync", AuthController.sync);
authRouter.get("/me", requireAuth, AuthController.me);
