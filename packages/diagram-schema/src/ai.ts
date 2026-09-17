import { z } from "zod";
import { NodeTypeEnum } from "./nodes.js";
import { EdgeTypeEnum } from "./edges.js";

export const AiGeneratedNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeEnum,
  label: z.string(),
  description: z.string().optional(),
  tech: z.string().optional(),
  position: z.object({
    x: z.number().optional(),
    y: z.number().optional()
  }).optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

export const AiGeneratedEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: EdgeTypeEnum.optional()
});

export const AiDiagramResponseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  nodes: z.array(AiGeneratedNodeSchema),
  edges: z.array(AiGeneratedEdgeSchema)
});

export type AiDiagramResponse = z.infer<typeof AiDiagramResponseSchema>;

export const GenerateDiagramRequestSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters long"),
  existingDiagram: z.any().optional()
});

export type GenerateDiagramRequest = z.infer<typeof GenerateDiagramRequestSchema>;

export const ModifyDiagramRequestSchema = z.object({
  instruction: z.string().min(3, "Instruction must be at least 3 characters long"),
  currentDiagram: z.any()
});

export type ModifyDiagramRequest = z.infer<typeof ModifyDiagramRequestSchema>;
