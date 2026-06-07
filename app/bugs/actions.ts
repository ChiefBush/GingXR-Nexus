"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createBugSchema,
  updateBugSchema,
  moveBugSchema,
  createCommentSchema,
  updateCommentSchema,
} from "@/lib/validations/bug";
import type { Prisma } from "@prisma/client";

const bugInclude = {
  product: { select: { id: true, name: true } },
  release: { select: { id: true, version: true, name: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  reporter: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BugInclude;

export type BugWithRelations = Prisma.BugGetPayload<{
  include: typeof bugInclude;
}>;

const listInclude = {
  product: { select: { id: true, name: true } },
  release: { select: { id: true, version: true } },
  assignee: { select: { id: true, name: true, email: true } },
  reporter: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BugInclude;

export type BugListItem = Prisma.BugGetPayload<{
  include: typeof listInclude;
}>;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { select: { id: true; name: true; email: true; image: true } } };
}>;

// ── Bugs ────────────────────────────────────────────────────────────

// Generate a short unique bugId slug like "BUG-12". Counter is best-effort;
// uniqueness is enforced by a unique index on the column.
async function nextBugId(): Promise<string> {
  const last = await prisma.bug.findFirst({
    orderBy: { createdAt: "desc" },
    select: { bugId: true },
  });
  let n = 1;
  if (last?.bugId) {
    const m = last.bugId.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `BUG-${n}`;
}

export async function createBug(
  input: unknown,
): Promise<ApiResponse<BugWithRelations>> {
  try {
    const user = await requireUser();
    const data = createBugSchema.parse(input);
    const bugId = await nextBugId();
    const bug = await prisma.bug.create({
      data: {
        bugId,
        title: data.title,
        description: data.description ?? undefined,
        severity: data.severity,
        priority: data.priority,
        status: data.status,
        platform: data.platform ?? undefined,
        productId: data.productId ?? undefined,
        releaseId: data.releaseId ?? undefined,
        version: data.version ?? undefined,
        assigneeId: data.assigneeId ?? undefined,
        reporterId: user.id,
        steps: data.steps ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: bugInclude,
    });
    revalidatePath("/bugs");
    return ok(bug);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create bug");
  }
}

export async function updateBug(
  input: unknown,
): Promise<ApiResponse<BugWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateBugSchema.parse(input);
    const bug = await prisma.bug.update({
      where: { id },
      data: {
        ...patch,
        description: patch.description ?? null,
        platform: patch.platform ?? null,
        productId: patch.productId ?? null,
        releaseId: patch.releaseId ?? null,
        version: patch.version ?? null,
        assigneeId: patch.assigneeId ?? null,
        steps: patch.steps ?? null,
        updatedById: user.id,
      },
      include: bugInclude,
    });
    revalidatePath("/bugs");
    revalidatePath(`/bugs/${id}`);
    return ok(bug);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update bug");
  }
}

export async function deleteBug(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.bug.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/bugs");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete bug");
  }
}

export async function moveBug(
  input: unknown,
): Promise<ApiResponse<BugWithRelations>> {
  try {
    const user = await requireUser();
    const { id, status } = moveBugSchema.parse(input);
    const bug = await prisma.bug.update({
      where: { id },
      data: { status, updatedById: user.id },
      include: bugInclude,
    });
    revalidatePath("/bugs");
    revalidatePath(`/bugs/${id}`);
    return ok(bug);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to move bug");
  }
}

export async function listBugs(): Promise<ApiResponse<BugListItem[]>> {
  try {
    const bugs = await prisma.bug.findMany({
      where: { deletedAt: null },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      include: listInclude,
    });
    return ok(bugs);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list bugs");
  }
}

export async function getBug(
  id: string,
): Promise<ApiResponse<BugWithRelations | null>> {
  try {
    const bug = await prisma.bug.findFirst({
      where: { id, deletedAt: null },
      include: bugInclude,
    });
    return ok(bug);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch bug");
  }
}

// ── Comments (polymorphic) ──────────────────────────────────────────

export async function listBugComments(
  bugId: string,
): Promise<ApiResponse<CommentWithAuthor[]>> {
  try {
    await requireUser();
    const comments = await prisma.comment.findMany({
      where: { entityType: "bug", entityId: bugId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    return ok(comments);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list comments");
  }
}

export async function addBugComment(
  input: unknown,
): Promise<ApiResponse<CommentWithAuthor>> {
  try {
    const user = await requireUser();
    const data = createCommentSchema.parse(input);
    const comment = await prisma.comment.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        content: data.content,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    revalidatePath(`/bugs/${data.entityId}`);
    return ok(comment);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to add comment");
  }
}

export async function updateBugComment(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const { id, content } = updateCommentSchema.parse(input);
    // Server-side: only the author can edit their comment.
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return fail("Comment not found");
    if (existing.authorId !== user.id) return fail("You can only edit your own comments");
    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
    });
    revalidatePath(`/bugs/${existing.entityId}`);
    return ok({ id: updated.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update comment");
  }
}

export async function deleteBugComment(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return fail("Comment not found");
    if (existing.authorId !== user.id) return fail("You can only delete your own comments");
    await prisma.comment.delete({ where: { id } });
    revalidatePath(`/bugs/${existing.entityId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete comment");
  }
}

// ── List-page metrics ───────────────────────────────────────────────

export type BugMetrics = {
  total: number;
  open: number;
  investigating: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
};

export async function getBugMetrics(): Promise<ApiResponse<BugMetrics>> {
  try {
    const [total, open, investigating, inProgress, resolved, closed, critical] =
      await Promise.all([
        prisma.bug.count({ where: { deletedAt: null } }),
        prisma.bug.count({ where: { deletedAt: null, status: "OPEN" } }),
        prisma.bug.count({ where: { deletedAt: null, status: "INVESTIGATING" } }),
        prisma.bug.count({ where: { deletedAt: null, status: "IN_PROGRESS" } }),
        prisma.bug.count({ where: { deletedAt: null, status: "RESOLVED" } }),
        prisma.bug.count({ where: { deletedAt: null, status: "CLOSED" } }),
        prisma.bug.count({ where: { deletedAt: null, severity: "CRITICAL" } }),
      ]);
    return ok({
      total,
      open,
      investigating,
      inProgress,
      resolved,
      closed,
      critical,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
