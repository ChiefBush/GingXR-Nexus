"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createInvestorSchema,
  updateInvestorSchema,
  createGrantSchema,
  updateGrantSchema,
  createPartnershipSchema,
  updatePartnershipSchema,
  createVendorSchema,
  updateVendorSchema,
} from "@/lib/validations/operations";

// ── Investors ───────────────────────────────────────────────────────

export type InvestorRow = Prisma.InvestorGetPayload<{}>;

export async function listInvestors(): Promise<ApiResponse<InvestorRow[]>> {
  try {
    const rows = await prisma.investor.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list investors");
  }
}

export async function getInvestor(
  id: string,
): Promise<ApiResponse<InvestorRow | null>> {
  try {
    const row = await prisma.investor.findFirst({
      where: { id, deletedAt: null },
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch investor");
  }
}

export async function createInvestor(
  input: unknown,
): Promise<ApiResponse<InvestorRow>> {
  try {
    const user = await requireUser();
    const data = createInvestorSchema.parse(input);
    const row = await prisma.investor.create({
      data: {
        ...data,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create investor");
  }
}

export async function updateInvestor(
  input: unknown,
): Promise<ApiResponse<InvestorRow>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateInvestorSchema.parse(input);
    const row = await prisma.investor.update({
      where: { id },
      data: {
        ...patch,
        fund: patch.fund ?? null,
        email: patch.email ?? null,
        phone: patch.phone ?? null,
        ticketSize: patch.ticketSize ?? null,
        lastMeeting: patch.lastMeeting ?? null,
        nextFollowUp: patch.nextFollowUp ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update investor");
  }
}

export async function deleteInvestor(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.investor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/operations");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete investor");
  }
}

// ── Grants ──────────────────────────────────────────────────────────

export type GrantRow = Prisma.GrantGetPayload<{}>;

export async function listGrants(): Promise<ApiResponse<GrantRow[]>> {
  try {
    const rows = await prisma.grant.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { deadline: "asc" }],
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list grants");
  }
}

export async function getGrant(
  id: string,
): Promise<ApiResponse<GrantRow | null>> {
  try {
    const row = await prisma.grant.findFirst({
      where: { id, deletedAt: null },
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch grant");
  }
}

export async function createGrant(
  input: unknown,
): Promise<ApiResponse<GrantRow>> {
  try {
    const user = await requireUser();
    const data = createGrantSchema.parse(input);
    const row = await prisma.grant.create({
      data: {
        program: data.program,
        organization: data.organization,
        status: data.status,
        deadline: data.deadline ?? undefined,
        notes: data.notes ?? undefined,
        amount:
          data.amount !== null && data.amount !== undefined
            ? new Prisma.Decimal(data.amount)
            : undefined,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create grant");
  }
}

export async function updateGrant(
  input: unknown,
): Promise<ApiResponse<GrantRow>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateGrantSchema.parse(input);
    const row = await prisma.grant.update({
      where: { id },
      data: {
        program: patch.program,
        organization: patch.organization,
        status: patch.status,
        amount:
          patch.amount !== null && patch.amount !== undefined
            ? new Prisma.Decimal(patch.amount)
            : null,
        deadline: patch.deadline ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update grant");
  }
}

export async function deleteGrant(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.grant.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/operations");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete grant");
  }
}

// ── Partnerships ────────────────────────────────────────────────────

export type PartnershipRow = Prisma.PartnershipGetPayload<{}>;

export async function listPartnerships(): Promise<ApiResponse<PartnershipRow[]>> {
  try {
    const rows = await prisma.partnership.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { organization: "asc" }],
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list partnerships");
  }
}

export async function getPartnership(
  id: string,
): Promise<ApiResponse<PartnershipRow | null>> {
  try {
    const row = await prisma.partnership.findFirst({
      where: { id, deletedAt: null },
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch partnership");
  }
}

export async function createPartnership(
  input: unknown,
): Promise<ApiResponse<PartnershipRow>> {
  try {
    const user = await requireUser();
    const data = createPartnershipSchema.parse(input);
    const row = await prisma.partnership.create({
      data: {
        ...data,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create partnership");
  }
}

export async function updatePartnership(
  input: unknown,
): Promise<ApiResponse<PartnershipRow>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updatePartnershipSchema.parse(input);
    const row = await prisma.partnership.update({
      where: { id },
      data: {
        ...patch,
        contactName: patch.contactName ?? null,
        contactEmail: patch.contactEmail ?? null,
        contactPhone: patch.contactPhone ?? null,
        type: patch.type ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update partnership");
  }
}

export async function deletePartnership(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.partnership.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/operations");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete partnership");
  }
}

// ── Vendors ─────────────────────────────────────────────────────────

export type VendorRow = Prisma.VendorGetPayload<{}>;

export async function listVendors(): Promise<ApiResponse<VendorRow[]>> {
  try {
    const rows = await prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { renewalDate: "asc" }, { name: "asc" }],
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list vendors");
  }
}

export async function getVendor(
  id: string,
): Promise<ApiResponse<VendorRow | null>> {
  try {
    const row = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch vendor");
  }
}

export async function createVendor(
  input: unknown,
): Promise<ApiResponse<VendorRow>> {
  try {
    const user = await requireUser();
    const data = createVendorSchema.parse(input);
    const row = await prisma.vendor.create({
      data: {
        ...data,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create vendor");
  }
}

export async function updateVendor(
  input: unknown,
): Promise<ApiResponse<VendorRow>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateVendorSchema.parse(input);
    const row = await prisma.vendor.update({
      where: { id },
      data: {
        ...patch,
        service: patch.service ?? null,
        contactName: patch.contactName ?? null,
        contactEmail: patch.contactEmail ?? null,
        contactPhone: patch.contactPhone ?? null,
        contractUrl: patch.contractUrl ?? null,
        renewalDate: patch.renewalDate ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
    });
    revalidatePath("/operations");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update vendor");
  }
}

export async function deleteVendor(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/operations");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete vendor");
  }
}

// ── Metrics ─────────────────────────────────────────────────────────

export type OperationsMetrics = {
  totalInvestors: number;
  activeInvestors: number;
  totalGrants: number;
  grantsAwarded: number;
  totalFundingUsd: number;
  totalPartnerships: number;
  activePartnerships: number;
  totalVendors: number;
  activeVendors: number;
  vendorsRenewingSoon: number;
};

export async function getOperationsMetrics(): Promise<
  ApiResponse<OperationsMetrics>
> {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalInvestors,
      activeInvestors,
      totalGrants,
      grantsAwarded,
      grantsAgg,
      totalPartnerships,
      activePartnerships,
      totalVendors,
      activeVendors,
      vendorsRenewingSoon,
    ] = await Promise.all([
      prisma.investor.count({ where: { deletedAt: null } }),
      prisma.investor.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.grant.count({ where: { deletedAt: null } }),
      prisma.grant.count({
        where: { deletedAt: null, status: "AWARDED" },
      }),
      prisma.grant.aggregate({
        where: { deletedAt: null, status: "AWARDED" },
        _sum: { amount: true },
      }),
      prisma.partnership.count({ where: { deletedAt: null } }),
      prisma.partnership.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.vendor.count({ where: { deletedAt: null } }),
      prisma.vendor.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.vendor.count({
        where: {
          deletedAt: null,
          renewalDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
    ]);

    const totalFundingUsd = grantsAgg._sum.amount
      ? Number(grantsAgg._sum.amount)
      : 0;

    return ok({
      totalInvestors,
      activeInvestors,
      totalGrants,
      grantsAwarded,
      totalFundingUsd,
      totalPartnerships,
      activePartnerships,
      totalVendors,
      activeVendors,
      vendorsRenewingSoon,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
