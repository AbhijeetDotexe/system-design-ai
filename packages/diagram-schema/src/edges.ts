import { z } from "zod";

export const EdgeTypeEnum = z.enum(["arrow", "line", "bidirectional", "dashed"]);
export type EdgeType = z.infer<typeof EdgeTypeEnum>;

export const DiagramEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  type: EdgeTypeEnum.default("arrow").optional(),
  style: z.object({
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    animated: z.boolean().optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>;
