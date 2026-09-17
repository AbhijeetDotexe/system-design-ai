import { z } from "zod";

export const NodeTypeEnum = z.enum([
  // Architecture & Cloud Types
  "client",
  "browser",
  "mobile",
  "api_gateway",
  "load_balancer",
  "service",
  "microservice",
  "server",
  "database",
  "postgresql",
  "mongodb",
  "mysql",
  "redis",
  "cache",
  "kafka",
  "rabbitmq",
  "queue",
  "storage",
  "cdn",
  "auth",
  "external",
  "aws",
  "gcp",
  "azure",
  "kubernetes",
  "docker",
  "monitoring",
  "logging",
  "custom",
  // Free-form Shape & Drawing Types
  "rectangle",
  "rounded_rectangle",
  "ellipse",
  "circle",
  "diamond",
  "text",
  "freehand",
  "line"
]);

export type NodeType = z.infer<typeof NodeTypeEnum>;

export const NodeStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  opacity: z.number().optional(),
  fontSize: z.number().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  rotation: z.number().optional(),
  zIndex: z.number().optional(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional()
});

export type NodeStyle = z.infer<typeof NodeStyleSchema>;

export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeEnum.default("service"),
  label: z.string().default(""),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  width: z.number().default(180),
  height: z.number().default(90),
  style: NodeStyleSchema.optional(),
  tech: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type DiagramNode = z.infer<typeof DiagramNodeSchema>;
