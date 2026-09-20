import { Request, Response, NextFunction } from "express";
import { geminiService } from "../ai/gemini.service.js";
import { GenerateDiagramRequestSchema, ModifyDiagramRequestSchema, SimplifyDiagramRequestSchema } from "@systemcraft/diagram-schema";

export class AiController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = GenerateDiagramRequestSchema.parse(req.body);
      const generatedDiagram = await geminiService.generateDiagram(validated.prompt, validated.detail ?? "standard");

      res.json({
        success: true,
        data: generatedDiagram
      });
    } catch (error) {
      next(error);
    }
  }

  static async modify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ModifyDiagramRequestSchema.parse(req.body);
      const updatedDiagram = await geminiService.modifyDiagram(
        validated.instruction,
        validated.currentDiagram
      );

      res.json({
        success: true,
        data: updatedDiagram
      });
    } catch (error) {
      next(error);
    }
  }

  static async simplify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SimplifyDiagramRequestSchema.parse(req.body);
      const simplified = await geminiService.simplifyDiagram(
        validated.currentDiagram,
        validated.maxNodes ?? 8
      );

      res.json({
        success: true,
        data: simplified
      });
    } catch (error) {
      next(error);
    }
  }

  static async summarize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentDiagram } = req.body;
      if (!currentDiagram) {
        res.status(400).json({ success: false, error: "currentDiagram is required" });
        return;
      }
      const summary = await geminiService.summarizeDiagram(currentDiagram);

      res.json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  }
}
