import { z } from "zod";
import { DiagramDocumentSchema } from "@systemcraft/diagram-schema";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const RegisterUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export type LoginUserDto = z.infer<typeof LoginUserSchema>;

export const CreateDiagramSchema = z.object({
  title: z.string().min(1).default("Untitled Diagram"),
  document: DiagramDocumentSchema.optional(),
  thumbnail: z.string().optional()
});

export type CreateDiagramDto = z.infer<typeof CreateDiagramSchema>;

export const UpdateDiagramSchema = z.object({
  title: z.string().min(1).optional(),
  document: DiagramDocumentSchema.optional(),
  thumbnail: z.string().optional()
});

export type UpdateDiagramDto = z.infer<typeof UpdateDiagramSchema>;
