"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createLeadSchema,
  updateLeadSchema,
  leadListQuerySchema,
  type LeadListQuery,
} from "@/lib/validations/crm";
import type { Prisma } from "@prisma/client";

export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: { assignedTo: true; createdBy: true };
}>;

export async function createLead(
  input: unknown,
): Promise<ApiResponse<LeadWithRelations>> {
  try {
    const user = await requireUser();
    const data = createLeadSchema.parse(input);

    const lead = await prisma.lead.create({
      data: {
        ...data,
        value: data.value ?? undefined,
        assignedToId: data.assignedToId ?? undefined,
        createdById: user.id,
        updatedById: user.id,
      },
      include: { assignedTo: true, createdBy: true },
    });

    revalidatePath("/crm");
    return ok(lead);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create lead");
  }
}

export async function updateLead(
  input: unknown,
): Promise<ApiResponse<LeadWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateLeadSchema.parse(input);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...patch,
        value: patch.value ?? undefined,
        assignedToId: patch.assignedToId ?? null,
        updatedById: user.id,
      },
      include: { assignedTo: true, createdBy: true },
    });

    revalidatePath("/crm");
    revalidatePath(`/crm/${id}`);
    return ok(lead);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update lead");
  }
}

export async function deleteLead(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/crm");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete lead");
  }
}

export async function changeLeadStatus(
  id: string,
  status: string,
): Promise<ApiResponse<LeadWithRelations>> {
  try {
    const user = await requireUser();
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: status as never, updatedById: user.id },
      include: { assignedTo: true, createdBy: true },
    });
    revalidatePath("/crm");
    revalidatePath(`/crm/${id}`);
    return ok(lead);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to change status");
  }
}

export type LeadListResult = {
  data: LeadWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listLeads(
  query: Partial<LeadListQuery> = {},
): Promise<ApiResponse<LeadListResult>> {
  try {
    const params = leadListQuerySchema.parse(query);
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.search
        ? {
            OR: [
              { companyName: { contains: params.search, mode: "insensitive" } },
              { contactName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.LeadOrderByWithRelationInput = {
      [params.sortBy]: params.sortOrder,
    } as Prisma.LeadOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: { assignedTo: true, createdBy: true },
      }),
      prisma.lead.count({ where }),
    ]);

    return ok({
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list leads");
  }
}

export async function getLead(
  id: string,
): Promise<ApiResponse<LeadWithRelations | null>> {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: { assignedTo: true, createdBy: true },
    });
    return ok(lead);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch lead");
  }
}
