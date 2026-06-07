import { z } from "zod";

export const assetStatusEnum = z.enum([
  "ACTIVE",
  "EXPIRED",
  "IN_MAINTENANCE",
  "DISPOSED",
]);

// ── Categories ─────────────────────────────────────────────────────

export const createAssetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
});
export const updateAssetCategorySchema = createAssetCategorySchema
  .partial()
  .extend({ id: z.string().uuid() });

// ── Assets ──────────────────────────────────────────────────────────

export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  assetCategoryId: z.string().uuid(),
  ownerId: z.string().uuid().optional().nullable(),
  value: z.coerce.number().nonnegative().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  status: assetStatusEnum.default("ACTIVE"),
  notes: z.string().max(5000).optional().nullable(),
});
export const updateAssetSchema = createAssetSchema.partial().extend({
  id: z.string().uuid(),
});

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
  status: assetStatusEnum.optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ── Assignments ────────────────────────────────────────────────────

export const createAssignmentSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  assignedAt: z.coerce.date().optional().nullable(),
  condition: z.string().max(500).optional().nullable(),
});
export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  id: z.string().uuid(),
});
// Returning an asset
export const returnAssignmentSchema = z.object({
  id: z.string().uuid(),
  condition: z.string().max(500).optional().nullable(),
});

export type CreateAssetCategoryInput = z.infer<
  typeof createAssetCategorySchema
>;
export type UpdateAssetCategoryInput = z.infer<
  typeof updateAssetCategorySchema
>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetListQuery = z.infer<typeof assetListQuerySchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
