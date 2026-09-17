import { z } from "zod";
import { DiagramNodeSchema } from "./nodes.js";
import { DiagramEdgeSchema } from "./edges.js";

export const ViewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().default(1)
});

export type Viewport = z.infer<typeof ViewportSchema>;

export const DiagramDocumentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).default("Untitled Architecture"),
  description: z.string().optional(),
  nodes: z.array(DiagramNodeSchema).default([]),
  edges: z.array(DiagramEdgeSchema).default([]),
  viewport: ViewportSchema.default({ x: 0, y: 0, zoom: 1 }),
  tags: z.array(z.string()).optional()
});

export type DiagramDocument = z.infer<typeof DiagramDocumentSchema>;
