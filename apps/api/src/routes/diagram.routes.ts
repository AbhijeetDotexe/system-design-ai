import { Router } from "express";
import { DiagramController } from "../controllers/diagram.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

export const diagramRouter = Router();

diagramRouter.get("/", requireAuth, DiagramController.list);
diagramRouter.post("/", requireAuth, DiagramController.create);
diagramRouter.get("/:id", optionalAuth, DiagramController.getById);
diagramRouter.patch("/:id", requireAuth, DiagramController.update);
diagramRouter.delete("/:id", requireAuth, DiagramController.delete);
diagramRouter.post("/:id/duplicate", requireAuth, DiagramController.duplicate);
diagramRouter.post("/:id/share", requireAuth, DiagramController.share);

// Versions
diagramRouter.get("/:id/versions", requireAuth, DiagramController.getVersions);
diagramRouter.post("/:id/versions", requireAuth, DiagramController.createVersion);
