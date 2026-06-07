"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createCategorySchema,
  updateCategorySchema,
  createArticleSchema,
  updateArticleSchema,
  restoreVersionSchema,
} from "@/lib/validations/knowledge-base";
import type { Prisma } from "@prisma/client";

// ── Categories ──────────────────────────────────────────────────────

const categoryInclude = {
  parent: { select: { id: true, name: true } },
  _count: { select: { articles: { where: { deletedAt: null } } } },
} satisfies Prisma.CategoryInclude;

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: typeof categoryInclude;
}>;

export async function listCategories(): Promise<ApiResponse<CategoryWithRelations[]>> {
  try {
    const cats = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: categoryInclude,
    });
    return ok(cats);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list categories");
  }
}

export async function getCategory(
  id: string,
): Promise<ApiResponse<CategoryWithRelations | null>> {
  try {
    const cat = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: categoryInclude,
    });
    return ok(cat);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch category");
  }
}

export async function createCategory(
  input: unknown,
): Promise<ApiResponse<CategoryWithRelations>> {
  try {
    const user = await requireUser();
    const data = createCategorySchema.parse(input);
    const cat = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        parentId: data.parentId ?? undefined,
        // Categories don't have createdById/updatedById in the schema, so we
        // just rely on createdAt/updatedAt for ordering.
      },
      include: categoryInclude,
    });
    revalidatePath("/knowledge-base");
    return ok(cat);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create category");
  }
}

export async function updateCategory(
  input: unknown,
): Promise<ApiResponse<CategoryWithRelations>> {
  try {
    await requireUser();
    const { id, ...patch } = updateCategorySchema.parse(input);
    const cat = await prisma.category.update({
      where: { id },
      data: {
        ...patch,
        description: patch.description ?? null,
        parentId: patch.parentId ?? null,
      },
      include: categoryInclude,
    });
    revalidatePath("/knowledge-base");
    return ok(cat);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update category");
  }
}

export async function deleteCategory(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/knowledge-base");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete category");
  }
}

// ── Articles ────────────────────────────────────────────────────────

const articleInclude = {
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} satisfies Prisma.ArticleInclude;

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

const articleDetailInclude = {
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  versions: {
    orderBy: { version: "desc" as const },
    include: {
      // No author relation on ArticleVersion in the schema; createdById is just stored.
    },
  },
} satisfies Prisma.ArticleInclude;

export type ArticleDetail = Prisma.ArticleGetPayload<{
  include: typeof articleDetailInclude;
}>;

const listInclude = {
  category: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ArticleInclude;

export type ArticleListItem = Prisma.ArticleGetPayload<{
  include: typeof listInclude;
}>;

// Slug helper — turn a title into "kebab-case-lower-12". Append "-2", "-3"…
// to disambiguate if the slug already exists.
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200) || "article";
  let candidate = slug;
  let n = 1;
  // Bounded retries — collision chain is unlikely to be deep in practice.
  while (n < 100) {
    const existing = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return `${slug}-${Date.now()}`;
}

export async function createArticle(
  input: unknown,
): Promise<ApiResponse<ArticleDetail>> {
  try {
    const user = await requireUser();
    const data = createArticleSchema.parse(input);
    const slug = data.slug
      ? await uniqueSlug(data.slug)
      : await uniqueSlug(data.title);

    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          title: data.title,
          slug,
          content: data.content,
          summary: data.summary ?? undefined,
          categoryId: data.categoryId,
          tags: data.tags,
          status: data.status,
          version: 1,
          createdById: user.id,
          updatedById: user.id,
        },
        include: articleDetailInclude,
      });
      // Snapshot initial version.
      await tx.articleVersion.create({
        data: {
          articleId: created.id,
          content: created.content,
          version: 1,
          createdById: user.id,
        },
      });
      return created;
    });

    revalidatePath("/knowledge-base");
    revalidatePath(`/knowledge-base/${article.id}`);
    return ok(article);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create article");
  }
}

export async function updateArticle(
  input: unknown,
): Promise<ApiResponse<ArticleDetail>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateArticleSchema.parse(input);

    // Fetch the current article to know its current version + slug.
    const current = await prisma.article.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) return fail("Article not found");

    const nextVersion = current.version + 1;
    const nextSlug = patch.slug
      ? await uniqueSlug(patch.slug, id)
      : current.slug;

    const article = await prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id },
        data: {
          ...patch,
          slug: nextSlug,
          summary: patch.summary ?? null,
          version: nextVersion,
          updatedById: user.id,
        },
        include: articleDetailInclude,
      });
      // Snapshot this revision.
      await tx.articleVersion.create({
        data: {
          articleId: updated.id,
          content: updated.content,
          version: nextVersion,
          createdById: user.id,
        },
      });
      return updated;
    });

    revalidatePath("/knowledge-base");
    revalidatePath(`/knowledge-base/${id}`);
    return ok(article);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update article");
  }
}

export async function deleteArticle(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/knowledge-base");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete article");
  }
}

export async function listArticles(): Promise<ApiResponse<ArticleListItem[]>> {
  try {
    const articles = await prisma.article.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: listInclude,
    });
    return ok(articles);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list articles");
  }
}

export async function getArticle(
  id: string,
): Promise<ApiResponse<ArticleDetail | null>> {
  try {
    const article = await prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: articleDetailInclude,
    });
    return ok(article);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch article");
  }
}

// Restore an older version by copying its content into a new revision.
export async function restoreVersion(
  input: unknown,
): Promise<ApiResponse<ArticleDetail>> {
  try {
    const user = await requireUser();
    const { articleId, version } = restoreVersionSchema.parse(input);
    // ArticleVersion has no composite unique on (articleId, version), so
    // findFirst by both columns.
    const target = await prisma.articleVersion.findFirst({
      where: { articleId, version },
    });
    if (!target) return fail("Version not found");

    const current = await prisma.article.findFirst({
      where: { id: articleId, deletedAt: null },
    });
    if (!current) return fail("Article not found");

    const nextVersion = current.version + 1;
    const article = await prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id: articleId },
        data: {
          content: target.content,
          version: nextVersion,
          updatedById: user.id,
        },
        include: articleDetailInclude,
      });
      await tx.articleVersion.create({
        data: {
          articleId: updated.id,
          content: target.content,
          version: nextVersion,
          createdById: user.id,
        },
      });
      return updated;
    });
    revalidatePath(`/knowledge-base/${articleId}`);
    return ok(article);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to restore version");
  }
}

// ── List-page metrics ───────────────────────────────────────────────

export type KbMetrics = {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  categories: number;
};

export async function getKbMetrics(): Promise<ApiResponse<KbMetrics>> {
  try {
    const [total, published, drafts, archived, categories] = await Promise.all([
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
      prisma.article.count({ where: { deletedAt: null, status: "DRAFT" } }),
      prisma.article.count({ where: { deletedAt: null, status: "ARCHIVED" } }),
      prisma.category.count({ where: { deletedAt: null } }),
    ]);
    return ok({ total, published, drafts, archived, categories });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
