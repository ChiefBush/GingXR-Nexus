import { z } from "zod";

export const bugSeverityEnum = z.enum(["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]);
export const bugPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const bugStatusEnum = z.enum([
  "OPEN",
  "INVESTIGATING",
  "IN_PROGRESS",
  "TESTING",
  "RESOLVED",
  "CLOSED",
]);

// bugId is the human-readable slug shown in the UI (e.g. BUG-12).
// Server enforces uniqueness on create. reporterId is server-assigned
// (the current user is always the reporter on create); only admins should
// be able to reassign it, which is intentionally not exposed via this schema.
export const createBugSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(20000).optional().nullable(),
  severity: bugSeverityEnum.default("MINOR"),
  priority: bugPriorityEnum.default("MEDIUM"),
  status: bugStatusEnum.default("OPEN"),
  platform: z.string().max(100).optional().nullable(),
  productId: z.string().uuid().optional().nullable(),
  releaseId: z.string().uuid().optional().nullable(),
  version: z.string().max(50).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  steps: z.string().max(10000).optional().nullable(),
});

export const updateBugSchema = createBugSchema.partial().extend({
  id: z.string().uuid(),
});

export const moveBugSchema = z.object({
  id: z.string().uuid(),
  status: bugStatusEnum,
});

export const bugListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: bugStatusEnum.optional(),
  severity: bugSeverityEnum.optional(),
  priority: bugPriorityEnum.optional(),
  productId: z.string().uuid().optional(),
  releaseId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Comments are entity-polymorphic, so a tiny shared schema is fine.
export const createCommentSchema = z.object({
  entityType: z.literal("bug"),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export type CreateBugInput = z.infer<typeof createBugSchema>;
export type UpdateBugInput = z.infer<typeof updateBugSchema>;
export type MoveBugInput = z.infer<typeof moveBugSchema>;
export type BugListQuery = z.infer<typeof bugListQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
