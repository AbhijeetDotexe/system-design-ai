import { Router } from "express";
import { AiController } from "../controllers/ai.controller.js";
import { optionalAuth } from "../middleware/auth.js";

export const aiRouter = Router();

aiRouter.post("/generate-diagram", optionalAuth, AiController.generate);
aiRouter.post("/modify-diagram", optionalAuth, AiController.modify);
aiRouter.post("/simplify-diagram", optionalAuth, AiController.simplify);
aiRouter.post("/summarize-diagram", optionalAuth, AiController.summarize);
