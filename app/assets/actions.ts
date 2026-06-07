"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createAssetCategorySchema,
  updateAssetCategorySchema,
  createAssetSchema,
  updateAssetSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  returnAssignmentSchema,
} from "@/lib/validations/asset";

// ── Asset Categories ───────────────────────────────────────────────

export type AssetCategoryRow = Prisma.AssetCategoryGetPayload<{
  include: { _count: { select: { assets: true } } };
}>;

export async function listAssetCategories(): Promise<
  ApiResponse<AssetCategoryRow[]>
> {
  try {
    const rows = await prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    });
    return ok(rows);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to list asset categories",
    );
  }
}

export async function createAssetCategory(
  input: unknown,
): Promise<ApiResponse<AssetCategoryRow>> {
  try {
    await requireUser();
    const data = createAssetCategorySchema.parse(input);
    const row = await prisma.assetCategory.create({
      data: { name: data.name, description: data.description ?? undefined },
      include: { _count: { select: { assets: true } } },
    });
    revalidatePath("/assets");
    return ok(row);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to create asset category",
    );
  }
}

export async function updateAssetCategory(
  input: unknown,
): Promise<ApiResponse<AssetCategoryRow>> {
  try {
    await requireUser();
    const { id, ...patch } = updateAssetCategorySchema.parse(input);
    const row = await prisma.assetCategory.update({
      where: { id },
      data: { ...patch, description: patch.description ?? null },
      include: { _count: { select: { assets: true } } },
    });
    revalidatePath("/assets");
    return ok(row);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to update asset category",
    );
  }
}

export async function deleteAssetCategory(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.assetCategory.delete({ where: { id } });
    revalidatePath("/assets");
    return ok({ id });
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to delete asset category",
    );
  }
}

// ── Assets ─────────────────────────────────────────────────────────

const assetInclude = {
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true, employeeId: true } },
  assignments: {
    orderBy: { assignedAt: "desc" as const },
    take: 5,
    include: {
      employee: {
        select: { id: true, name: true, email: true, employeeId: true },
      },
    },
  },
  _count: { select: { assignments: true } },
} satisfies Prisma.AssetInclude;

export type AssetWithRelations = Prisma.AssetGetPayload<{
  include: typeof assetInclude;
}>;

const listInclude = {
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true, employeeId: true } },
  _count: { select: { assignments: true } },
} satisfies Prisma.AssetInclude;

export type AssetListItem = Prisma.AssetGetPayload<{
  include: typeof listInclude;
}>;

export async function listAssets(): Promise<ApiResponse<AssetListItem[]>> {
  try {
    const rows = await prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: listInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list assets");
  }
}

export async function getAsset(
  id: string,
): Promise<ApiResponse<AssetWithRelations | null>> {
  try {
    const row = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: assetInclude,
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch asset");
  }
}

export async function createAsset(
  input: unknown,
): Promise<ApiResponse<AssetWithRelations>> {
  try {
    const user = await requireUser();
    const data = createAssetSchema.parse(input);
    const row = await prisma.asset.create({
      data: {
        name: data.name,
        type: data.type,
        assetCategoryId: data.assetCategoryId,
        ownerId: data.ownerId ?? undefined,
        value:
          data.value !== null && data.value !== undefined
            ? new Prisma.Decimal(data.value)
            : undefined,
        purchaseDate: data.purchaseDate ?? undefined,
        expiryDate: data.expiryDate ?? undefined,
        renewalDate: data.renewalDate ?? undefined,
        status: data.status,
        notes: data.notes ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: assetInclude,
    });
    revalidatePath("/assets");
    revalidatePath(`/assets/${row.id}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create asset");
  }
}

export async function updateAsset(
  input: unknown,
): Promise<ApiResponse<AssetWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateAssetSchema.parse(input);
    const row = await prisma.asset.update({
      where: { id },
      data: {
        ...patch,
        ownerId: patch.ownerId ?? null,
        value:
          patch.value !== null && patch.value !== undefined
            ? new Prisma.Decimal(patch.value)
            : null,
        purchaseDate: patch.purchaseDate ?? null,
        expiryDate: patch.expiryDate ?? null,
        renewalDate: patch.renewalDate ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
      include: assetInclude,
    });
    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update asset");
  }
}

export async function deleteAsset(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/assets");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete asset");
  }
}

// ── Assignments ────────────────────────────────────────────────────

const assignmentInclude = {
  asset: { select: { id: true, name: true, type: true, status: true } },
  employee: {
    select: { id: true, name: true, email: true, employeeId: true },
  },
} satisfies Prisma.AssetAssignmentInclude;

export type AssignmentWithRelations = Prisma.AssetAssignmentGetPayload<{
  include: typeof assignmentInclude;
}>;

export async function listAssignments(
  assetId?: string,
  employeeId?: string,
): Promise<ApiResponse<AssignmentWithRelations[]>> {
  try {
    const where: Prisma.AssetAssignmentWhereInput = {};
    if (assetId) where.assetId = assetId;
    if (employeeId) where.employeeId = employeeId;
    const rows = await prisma.assetAssignment.findMany({
      where,
      orderBy: { assignedAt: "desc" },
      include: assignmentInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list assignments");
  }
}

export async function createAssignment(
  input: unknown,
): Promise<ApiResponse<AssignmentWithRelations>> {
  try {
    await requireUser();
    const data = createAssignmentSchema.parse(input);
    const row = await prisma.assetAssignment.create({
      data: {
        assetId: data.assetId,
        employeeId: data.employeeId,
        assignedAt: data.assignedAt ?? undefined,
        condition: data.condition ?? undefined,
      },
      include: assignmentInclude,
    });
    revalidatePath("/assets");
    revalidatePath(`/assets/${data.assetId}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create assignment");
  }
}

export async function returnAssignment(
  input: unknown,
): Promise<ApiResponse<AssignmentWithRelations>> {
  try {
    await requireUser();
    const { id, condition } = returnAssignmentSchema.parse(input);
    const row = await prisma.assetAssignment.update({
      where: { id },
      data: { returnedAt: new Date(), condition: condition ?? undefined },
      include: assignmentInclude,
    });
    revalidatePath("/assets");
    revalidatePath(`/assets/${row.assetId}`);
    return ok(row);
  } catch (e) {
    return fail(
      e instanceof Error ? e.message : "Failed to return assignment",
    );
  }
}

export async function deleteAssignment(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const row = await prisma.assetAssignment.delete({ where: { id } });
    revalidatePath("/assets");
    revalidatePath(`/assets/${row.assetId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete assignment");
  }
}

// ── Metrics ────────────────────────────────────────────────────────

export type AssetMetrics = {
  totalAssets: number;
  activeAssets: number;
  expiredAssets: number;
  totalValue: number;
  expiringSoon: number;
  unassignedAssets: number;
  totalCategories: number;
  currentlyAssigned: number;
};

export async function getAssetMetrics(): Promise<ApiResponse<AssetMetrics>> {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalAssets,
      activeAssets,
      expiredAssets,
      valueAgg,
      expiringSoon,
      totalCategories,
      currentlyAssigned,
      openAssignmentAssets,
    ] = await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.asset.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.asset.count({
        where: { deletedAt: null, status: "EXPIRED" },
      }),
      prisma.asset.aggregate({
        where: { deletedAt: null },
        _sum: { value: true },
      }),
      prisma.asset.count({
        where: {
          deletedAt: null,
          expiryDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      prisma.assetCategory.count(),
      prisma.assetAssignment.count({ where: { returnedAt: null } }),
      prisma.asset.findMany({
        where: { deletedAt: null },
        select: { id: true },
      }),
    ]);

    // Assets that have zero active assignments = unassigned
    const assignedIds = new Set(
      (
        await prisma.assetAssignment.findMany({
          where: { returnedAt: null },
          select: { assetId: true },
        })
      ).map((a) => a.assetId),
    );
    const unassignedAssets = openAssignmentAssets.filter(
      (a) => !assignedIds.has(a.id),
    ).length;

    const totalValue = valueAgg._sum.value
      ? Number(valueAgg._sum.value)
      : 0;

    return ok({
      totalAssets,
      activeAssets,
      expiredAssets,
      totalValue,
      expiringSoon,
      unassignedAssets,
      totalCategories,
      currentlyAssigned,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
