import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);
export const projectPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const taskStatusEnum = z.enum([
  "BACKLOG",
  "TO_DO",
  "IN_PROGRESS",
  "REVIEW",
  "TESTING",
  "DONE",
]);
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const sprintStatusEnum = z.enum(["PLANNING", "ACTIVE", "COMPLETED"]);
export const dependencyTypeEnum = z.enum(["BLOCKS", "RELATES_TO", "DUPLICATES"]);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  status: projectStatusEnum.default("PLANNING"),
  priority: projectPriorityEnum.default("MEDIUM"),
  startDate: z.coerce.date().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

export const createSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  goal: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: sprintStatusEnum.default("PLANNING"),
});

export const updateSprintSchema = createSprintSchema
  .partial()
  .extend({ id: z.string().uuid() })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  sprintId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(300),
  description: z.string().max(20000).optional().nullable(),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: taskStatusEnum.default("BACKLOG"),
  assigneeId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export const moveTaskSchema = z.object({
  id: z.string().uuid(),
  status: taskStatusEnum,
  sprintId: z.string().uuid().optional().nullable(),
});

export const addDependencySchema = z.object({
  taskId: z.string().uuid(),
  dependsOnId: z.string().uuid(),
  type: dependencyTypeEnum.default("BLOCKS"),
});

export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: projectStatusEnum.optional(),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type AddDependencyInput = z.infer<typeof addDependencySchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
