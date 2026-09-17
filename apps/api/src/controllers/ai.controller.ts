import { Request, Response, NextFunction } from "express";
import { geminiService } from "../ai/gemini.service.js";
import { GenerateDiagramRequestSchema, ModifyDiagramRequestSchema } from "@systemcraft/diagram-schema";

export class AiController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = GenerateDiagramRequestSchema.parse(req.body);
      const generatedDiagram = await geminiService.generateDiagram(validated.prompt);

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
}
