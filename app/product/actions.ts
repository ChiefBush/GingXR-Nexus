"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createProductSchema,
  updateProductSchema,
  createFeatureSchema,
  updateFeatureSchema,
  createSubFeatureSchema,
  createPlatformSchema,
  updatePlatformStatusSchema,
  productListQuerySchema,
} from "@/lib/validations/product";
import type { Prisma } from "@prisma/client";

const productInclude = {
  features: {
    include: {
      subFeatures: true,
      platformStatuses: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// ── Products ────────────────────────────────────────────────────────

export async function createProduct(
  input: unknown,
): Promise<ApiResponse<ProductWithRelations>> {
  try {
    const user = await requireUser();
    const data = createProductSchema.parse(input);
    const product = await prisma.product.create({
      data: {
        ...data,
        createdById: user.id,
        updatedById: user.id,
      },
      include: productInclude,
    });
    revalidatePath("/product");
    return ok(product);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create product");
  }
}

export async function updateProduct(
  input: unknown,
): Promise<ApiResponse<ProductWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateProductSchema.parse(input);
    const product = await prisma.product.update({
      where: { id },
      data: { ...patch, updatedById: user.id },
      include: productInclude,
    });
    revalidatePath("/product");
    revalidatePath(`/product/${id}`);
    return ok(product);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update product");
  }
}

export async function deleteProduct(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/product");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete product");
  }
}

export async function listProducts(): Promise<ApiResponse<ProductWithRelations[]>> {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });
    return ok(products);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list products");
  }
}

export async function getProduct(
  id: string,
): Promise<ApiResponse<ProductWithRelations | null>> {
  try {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
    return ok(product);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch product");
  }
}

// ── Platforms ────────────────────────────────────────────────────────

export async function listPlatforms(): Promise<ApiResponse<{ id: string; name: string }[]>> {
  try {
    const platforms = await prisma.platform.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return ok(platforms);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list platforms");
  }
}

export async function createPlatform(
  input: unknown,
): Promise<ApiResponse<{ id: string; name: string }>> {
  try {
    await requireUser();
    const data = createPlatformSchema.parse(input);
    const platform = await prisma.platform.create({ data });
    revalidatePath("/product");
    return ok(platform);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create platform");
  }
}

// ── Features ─────────────────────────────────────────────────────────

export async function createFeature(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = createFeatureSchema.parse(input);
    const feature = await prisma.feature.create({
      data: {
        ...data,
        releaseId: data.releaseId ?? undefined,
        sprintId: data.sprintId ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    revalidatePath("/product");
    return ok(feature);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create feature");
  }
}

export async function updateFeature(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateFeatureSchema.parse(input);
    await prisma.feature.update({
      where: { id },
      data: {
        ...patch,
        releaseId: patch.releaseId ?? null,
        sprintId: patch.sprintId ?? null,
        updatedById: user.id,
      },
    });
    revalidatePath("/product");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update feature");
  }
}

export async function deleteFeature(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.feature.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/product");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete feature");
  }
}

// ── SubFeatures ──────────────────────────────────────────────────────

export async function createSubFeature(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = createSubFeatureSchema.parse(input);
    const sf = await prisma.subFeature.create({ data });
    revalidatePath("/product");
    return ok(sf);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create sub-feature");
  }
}

// ── Platform Status (the matrix cell) ────────────────────────────────

export async function setPlatformStatus(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const data = updatePlatformStatusSchema.parse(input);
    if (!data.featureId && !data.subFeatureId) {
      return fail("Either featureId or subFeatureId is required");
    }

    // Upsert on the unique (featureId, subFeatureId, platformId) constraint.
    const existing = await prisma.featureStatus.findFirst({
      where: {
        platformId: data.platformId,
        featureId: data.featureId ?? null,
        subFeatureId: data.subFeatureId ?? null,
      },
    });

    const cell = existing
      ? await prisma.featureStatus.update({
          where: { id: existing.id },
          data: { status: data.status, notes: data.notes ?? null },
        })
      : await prisma.featureStatus.create({
          data: {
            featureId: data.featureId ?? null,
            subFeatureId: data.subFeatureId ?? null,
            platformId: data.platformId,
            status: data.status,
            notes: data.notes ?? null,
          },
        });

    revalidatePath("/product");
    return ok(cell);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to set status");
  }
}
