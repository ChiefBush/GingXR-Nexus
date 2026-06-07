import { z } from "zod";

export const releaseStatusEnum = z.enum([
  "PLANNING",
  "DEVELOPMENT",
  "QA",
  "RELEASED",
]);

export const releaseNoteCategoryEnum = z.enum([
  "FEATURE",
  "BUGFIX",
  "IMPROVEMENT",
  "BREAKING",
  "GENERAL",
]);

export const createReleaseSchema = z.object({
  productId: z.string().uuid(),
  version: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, underscores, or dashes"),
  name: z.string().min(1).max(200),
  releaseDate: z.coerce.date().optional().nullable(),
  status: releaseStatusEnum.default("PLANNING"),
  notes: z.string().max(10000).optional().nullable(),
});

export const updateReleaseSchema = createReleaseSchema.partial().extend({
  id: z.string().uuid(),
});

export const createReleaseNoteSchema = z.object({
  releaseId: z.string().uuid(),
  category: releaseNoteCategoryEnum.default("GENERAL"),
  content: z.string().min(1).max(2000),
});

export const updateReleaseNoteSchema = z.object({
  id: z.string().uuid(),
  category: releaseNoteCategoryEnum.optional(),
  content: z.string().min(1).max(2000).optional(),
});

// Linking a feature/bug/task to a release. Server enforces membership.
export const linkItemSchema = z.object({
  releaseId: z.string().uuid(),
  itemId: z.string().uuid(),
  itemType: z.enum(["feature", "bug", "task"]),
});

export const unlinkItemSchema = z.object({
  releaseId: z.string().uuid(),
  itemId: z.string().uuid(),
  itemType: z.enum(["feature", "bug", "task"]),
});

export const releaseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  productId: z.string().uuid().optional(),
  status: releaseStatusEnum.optional(),
  search: z.string().optional(),
});

export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;
export type CreateReleaseNoteInput = z.infer<typeof createReleaseNoteSchema>;
export type UpdateReleaseNoteInput = z.infer<typeof updateReleaseNoteSchema>;
export type LinkItemInput = z.infer<typeof linkItemSchema>;
export type UnlinkItemInput = z.infer<typeof unlinkItemSchema>;
export type ReleaseListQuery = z.infer<typeof releaseListQuerySchema>;
