import { z } from "zod";

export const featurePriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const platformStatusEnum = z.enum([
  "NOT_STARTED",
  "PLANNED",
  "IN_PROGRESS",
  "TESTING",
  "BLOCKED",
  "DONE",
]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export const createPlatformSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional().nullable(),
});

export const createFeatureSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  priority: featurePriorityEnum.default("MEDIUM"),
  releaseId: z.string().uuid().optional().nullable(),
  sprintId: z.string().uuid().optional().nullable(),
});

export const updateFeatureSchema = createFeatureSchema.partial().extend({
  id: z.string().uuid(),
});

export const createSubFeatureSchema = z.object({
  featureId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
});

export const updatePlatformStatusSchema = z.object({
  featureId: z.string().uuid().optional().nullable(),
  subFeatureId: z.string().uuid().optional().nullable(),
  platformId: z.string().uuid(),
  status: platformStatusEnum,
  notes: z.string().max(1000).optional().nullable(),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type CreateSubFeatureInput = z.infer<typeof createSubFeatureSchema>;
export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type UpdatePlatformStatusInput = z.infer<typeof updatePlatformStatusSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
