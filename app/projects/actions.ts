"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createProjectSchema,
  updateProjectSchema,
  createSprintSchema,
  updateSprintSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  addDependencySchema,
} from "@/lib/validations/project";
import type { Prisma } from "@prisma/client";

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  tasks: { where: { deletedAt: null, parentId: null } },
  sprints: { orderBy: { startDate: "desc" as const } },
} satisfies Prisma.ProjectInclude;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, image: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  subtasks: { where: { deletedAt: null } },
  dependencies: {
    include: {
      dependsOn: { select: { id: true, title: true, status: true } },
    },
  },
  sprint: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

// ── Projects ─────────────────────────────────────────────────────────

export async function createProject(
  input: unknown,
): Promise<ApiResponse<ProjectWithRelations>> {
  try {
    const user = await requireUser();
    const data = createProjectSchema.parse(input);
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId: data.ownerId ?? user.id,
        startDate: data.startDate ?? undefined,
        deadline: data.deadline ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: projectInclude,
    });
    revalidatePath("/projects");
    return ok(project);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create project");
  }
}

export async function updateProject(
  input: unknown,
): Promise<ApiResponse<ProjectWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateProjectSchema.parse(input);
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...patch,
        ownerId: patch.ownerId ?? undefined,
        startDate: patch.startDate ?? null,
        deadline: patch.deadline ?? null,
        updatedById: user.id,
      },
      include: projectInclude,
    });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return ok(project);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update project");
  }
}

export async function deleteProject(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/projects");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete project");
  }
}

export async function listProjects(): Promise<ApiResponse<ProjectWithRelations[]>> {
  try {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: projectInclude,
    });
    return ok(projects);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list projects");
  }
}

export async function getProject(
  id: string,
): Promise<ApiResponse<ProjectWithRelations | null>> {
  try {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: projectInclude,
    });
    return ok(project);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch project");
  }
}

// ── Sprints ──────────────────────────────────────────────────────────

export async function createSprint(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = createSprintSchema.parse(input);
    const sprint = await prisma.sprint.create({ data });
    revalidatePath(`/projects/${data.projectId}`);
    return ok(sprint);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create sprint");
  }
}

export async function updateSprint(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const { id, projectId, ...patch } = updateSprintSchema.parse(input);
    await prisma.sprint.update({ where: { id }, data: patch });
    if (projectId) revalidatePath(`/projects/${projectId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update sprint");
  }
}

// ── Tasks ────────────────────────────────────────────────────────────

export async function createTask(
  input: unknown,
): Promise<ApiResponse<TaskWithRelations>> {
  try {
    const user = await requireUser();
    const data = createTaskSchema.parse(input);
    const task = await prisma.task.create({
      data: {
        ...data,
        sprintId: data.sprintId ?? undefined,
        assigneeId: data.assigneeId ?? undefined,
        parentId: data.parentId ?? undefined,
        dueDate: data.dueDate ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: taskInclude,
    });
    revalidatePath(`/projects/${data.projectId}`);
    return ok(task);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create task");
  }
}

export async function updateTask(
  input: unknown,
): Promise<ApiResponse<TaskWithRelations>> {
  try {
    const user = await requireUser();
    const { id, projectId, ...patch } = updateTaskSchema.parse(input);
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...patch,
        sprintId: patch.sprintId ?? null,
        assigneeId: patch.assigneeId ?? null,
        parentId: patch.parentId ?? null,
        dueDate: patch.dueDate ?? null,
        updatedById: user.id,
      },
      include: taskInclude,
    });
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/projects/${task.projectId}/tasks/${id}`);
    return ok(task);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update task");
  }
}

export async function deleteTask(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const task = await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath(`/projects/${task.projectId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete task");
  }
}

export async function moveTask(
  input: unknown,
): Promise<ApiResponse<TaskWithRelations>> {
  try {
    const user = await requireUser();
    const { id, status, sprintId } = moveTaskSchema.parse(input);
    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        sprintId: sprintId ?? null,
        updatedById: user.id,
      },
      include: taskInclude,
    });
    revalidatePath(`/projects/${task.projectId}`);
    return ok(task);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to move task");
  }
}

export async function getProjectTasks(
  projectId: string,
  sprintId?: string,
): Promise<ApiResponse<TaskWithRelations[]>> {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
        parentId: null,
        ...(sprintId ? { sprintId } : sprintId === null ? { sprintId: null } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: taskInclude,
    });
    return ok(tasks);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list tasks");
  }
}

export async function getTask(
  id: string,
): Promise<ApiResponse<TaskWithRelations | null>> {
  try {
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: taskInclude,
    });
    return ok(task);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch task");
  }
}

// ── Dependencies ─────────────────────────────────────────────────────

export async function addDependency(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const { taskId, dependsOnId, type } = addDependencySchema.parse(input);
    if (taskId === dependsOnId) {
      return fail("A task cannot depend on itself");
    }
    const dep = await prisma.taskDependency.create({
      data: { taskId, dependsOnId, type },
    });
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (task) revalidatePath(`/projects/${task.projectId}`);
    return ok(dep);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to add dependency");
  }
}

export async function removeDependency(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const dep = await prisma.taskDependency.delete({ where: { id } });
    const task = await prisma.task.findUnique({ where: { id: dep.taskId } });
    if (task) revalidatePath(`/projects/${task.projectId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to remove dependency");
  }
}

// ── List-page metrics ────────────────────────────────────────────────

export type ProjectMetrics = {
  total: number;
  active: number;
  tasks: number;
  done: number;
};

export async function getProjectMetrics(): Promise<ApiResponse<ProjectMetrics>> {
  try {
    const [total, active, tasks, done] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null, status: "DONE" } }),
    ]);
    return ok({ total, active, tasks, done });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
