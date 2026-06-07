import { z } from "zod";

export const articleStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// Slug: lowercase letters, numbers, dashes. 1-200 chars.
export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes");

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export const createArticleSchema = z.object({
  title: z.string().min(1).max(300),
  // Slug is optional on create; server auto-generates from title if absent.
  slug: slugSchema.optional(),
  content: z.string().min(1).max(100_000),
  summary: z.string().max(2000).optional().nullable(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  status: articleStatusEnum.default("DRAFT"),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string().uuid(),
});

export const articleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.string().uuid().optional(),
  status: articleStatusEnum.optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

export const restoreVersionSchema = z.object({
  articleId: z.string().uuid(),
  version: z.coerce.number().int().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;
