"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createReleaseSchema,
  updateReleaseSchema,
  createReleaseNoteSchema,
  updateReleaseNoteSchema,
  linkItemSchema,
  unlinkItemSchema,
} from "@/lib/validations/release";
import type { Prisma } from "@prisma/client";

const releaseInclude = {
  product: { select: { id: true, name: true } },
  features: { select: { id: true, name: true, priority: true } },
  bugs: { select: { id: true, title: true, status: true, severity: true } },
  tasks: { select: { id: true, title: true, status: true, priority: true } },
  releaseNotes: { orderBy: { createdAt: "asc" as const } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ReleaseInclude;

export type ReleaseWithRelations = Prisma.ReleaseGetPayload<{
  include: typeof releaseInclude;
}>;

const listInclude = {
  product: { select: { id: true, name: true } },
  _count: { select: { features: true, bugs: true, tasks: true, releaseNotes: true } },
} satisfies Prisma.ReleaseInclude;

export type ReleaseListItem = Prisma.ReleaseGetPayload<{
  include: typeof listInclude;
}>;

// ── Releases ────────────────────────────────────────────────────────

export async function createRelease(
  input: unknown,
): Promise<ApiResponse<ReleaseWithRelations>> {
  try {
    const user = await requireUser();
    const data = createReleaseSchema.parse(input);
    const release = await prisma.release.create({
      data: {
        productId: data.productId,
        version: data.version,
        name: data.name,
        status: data.status,
        releaseDate: data.releaseDate ?? undefined,
        notes: data.notes ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: releaseInclude,
    });
    revalidatePath("/releases");
    return ok(release);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create release");
  }
}

export async function updateRelease(
  input: unknown,
): Promise<ApiResponse<ReleaseWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateReleaseSchema.parse(input);
    const release = await prisma.release.update({
      where: { id },
      data: {
        ...patch,
        releaseDate: patch.releaseDate ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
      include: releaseInclude,
    });
    revalidatePath("/releases");
    revalidatePath(`/releases/${id}`);
    return ok(release);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update release");
  }
}

export async function deleteRelease(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.release.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/releases");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete release");
  }
}

export async function listReleases(): Promise<ApiResponse<ReleaseListItem[]>> {
  try {
    const releases = await prisma.release.findMany({
      where: { deletedAt: null },
      orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
      include: listInclude,
    });
    return ok(releases);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list releases");
  }
}

export async function getRelease(
  id: string,
): Promise<ApiResponse<ReleaseWithRelations | null>> {
  try {
    const release = await prisma.release.findFirst({
      where: { id, deletedAt: null },
      include: releaseInclude,
    });
    return ok(release);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch release");
  }
}

// ── Release notes ───────────────────────────────────────────────────

export async function addReleaseNote(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = createReleaseNoteSchema.parse(input);
    const note = await prisma.releaseNote.create({
      data: {
        releaseId: data.releaseId,
        category: data.category,
        content: data.content,
      },
    });
    revalidatePath(`/releases/${data.releaseId}`);
    return ok(note);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to add release note");
  }
}

export async function updateReleaseNote(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateReleaseNoteSchema.parse(input);
    const note = await prisma.releaseNote.update({ where: { id }, data: patch });
    revalidatePath(`/releases/${note.releaseId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update release note");
  }
}

export async function deleteReleaseNote(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const note = await prisma.releaseNote.delete({ where: { id } });
    revalidatePath(`/releases/${note.releaseId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete release note");
  }
}

// ── Linking items to a release ─────────────────────────────────────

export async function linkItem(
  input: unknown,
): Promise<ApiResponse<{ releaseId: string; itemId: string }>> {
  try {
    const user = await requireUser();
    const { releaseId, itemId, itemType } = linkItemSchema.parse(input);
    const release = await prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
    });
    if (!release) return fail("Release not found");

    if (itemType === "feature") {
      // Ensure the feature exists and belongs to the release's product.
      const feature = await prisma.feature.findFirst({
        where: { id: itemId },
      });
      if (!feature) return fail("Feature not found");
      if (feature.productId !== release.productId) {
        return fail("Feature belongs to a different product");
      }
      await prisma.release.update({
        where: { id: releaseId },
        data: { features: { connect: { id: itemId } } },
      });
    } else if (itemType === "bug") {
      const bug = await prisma.bug.findFirst({
        where: { id: itemId, deletedAt: null },
      });
      if (!bug) return fail("Bug not found");
      if (bug.productId && bug.productId !== release.productId) {
        return fail("Bug belongs to a different product");
      }
      await prisma.release.update({
        where: { id: releaseId },
        data: { bugs: { connect: { id: itemId } } },
      });
    } else {
      const task = await prisma.task.findFirst({
        where: { id: itemId, deletedAt: null },
      });
      if (!task) return fail("Task not found");
      // Tasks belong to projects. We don't enforce a product mapping here —
      // release can include any task the team wants to ship in the cut.
      await prisma.release.update({
        where: { id: releaseId },
        data: { tasks: { connect: { id: itemId } } },
      });
    }
    revalidatePath(`/releases/${releaseId}`);
    return ok({ releaseId, itemId });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to link item");
  }
}

export async function unlinkItem(
  input: unknown,
): Promise<ApiResponse<{ releaseId: string; itemId: string }>> {
  try {
    const user = await requireUser();
    const { releaseId, itemId, itemType } = unlinkItemSchema.parse(input);
    if (itemType === "feature") {
      await prisma.release.update({
        where: { id: releaseId },
        data: { features: { disconnect: { id: itemId } } },
      });
    } else if (itemType === "bug") {
      await prisma.release.update({
        where: { id: releaseId },
        data: { bugs: { disconnect: { id: itemId } } },
      });
    } else {
      await prisma.release.update({
        where: { id: releaseId },
        data: { tasks: { disconnect: { id: itemId } } },
      });
    }
    revalidatePath(`/releases/${releaseId}`);
    return ok({ releaseId, itemId });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to unlink item");
  }
}

// ── Auto-generated changelog ────────────────────────────────────────

export type ChangelogEntry = {
  category: string;
  content: string;
  createdAt: Date;
};

export async function generateChangelog(
  releaseId: string,
): Promise<ApiResponse<ChangelogEntry[]>> {
  try {
    await requireUser();
    const release = await prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      include: {
        features: { select: { name: true, priority: true } },
        bugs: { select: { title: true, severity: true, status: true } },
        tasks: { select: { title: true, status: true } },
      },
    });
    if (!release) return fail("Release not found");

    const now = new Date();
    const entries: ChangelogEntry[] = [];

    for (const f of release.features) {
      entries.push({
        category: "FEATURE",
        content: `Added feature: ${f.name}`,
        createdAt: now,
      });
    }
    for (const b of release.bugs) {
      if (b.status === "RESOLVED" || b.status === "CLOSED") {
        entries.push({
          category: "BUGFIX",
          content: `Fixed: ${b.title}`,
          createdAt: now,
        });
      } else {
        entries.push({
          category: "BUGFIX",
          content: `Addressed: ${b.title}`,
          createdAt: now,
        });
      }
    }
    for (const t of release.tasks) {
      if (t.status === "DONE") {
        entries.push({
          category: "IMPROVEMENT",
          content: `Shipped: ${t.title}`,
          createdAt: now,
        });
      }
    }
    return ok(entries);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to generate changelog");
  }
}

// ── List-page metrics ──────────────────────────────────────────────

export type ReleaseMetrics = {
  total: number;
  planning: number;
  inProgress: number;
  released: number;
};

export async function getReleaseMetrics(): Promise<ApiResponse<ReleaseMetrics>> {
  try {
    const [total, planning, inProgress, released] = await Promise.all([
      prisma.release.count({ where: { deletedAt: null } }),
      prisma.release.count({ where: { deletedAt: null, status: "PLANNING" } }),
      prisma.release.count({
        where: { deletedAt: null, status: { in: ["DEVELOPMENT", "QA"] } },
      }),
      prisma.release.count({ where: { deletedAt: null, status: "RELEASED" } }),
    ]);
    return ok({ total, planning, inProgress, released });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
