"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createCandidateSchema,
  updateCandidateSchema,
  moveCandidateSchema,
  createInterviewSchema,
  updateInterviewSchema,
  createScorecardSchema,
  updateScorecardSchema,
} from "@/lib/validations/recruitment";
import type { Prisma } from "@prisma/client";

// ── Candidates ──────────────────────────────────────────────────────

const candidateInclude = {
  interviews: {
    orderBy: { scheduledAt: "desc" as const },
    take: 5,
  },
  scorecards: { orderBy: { createdAt: "desc" as const } },
  _count: { select: { interviews: true, scorecards: true } },
} satisfies Prisma.CandidateInclude;

export type CandidateWithRelations = Prisma.CandidateGetPayload<{
  include: typeof candidateInclude;
}>;

const listInclude = {
  _count: { select: { interviews: true, scorecards: true } },
} satisfies Prisma.CandidateInclude;

export type CandidateListItem = Prisma.CandidateGetPayload<{
  include: typeof listInclude;
}>;

export async function listCandidates(): Promise<ApiResponse<CandidateListItem[]>> {
  try {
    const rows = await prisma.candidate.findMany({
      where: { deletedAt: null },
      orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
      include: listInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list candidates");
  }
}

export async function getCandidate(
  id: string,
): Promise<ApiResponse<CandidateWithRelations | null>> {
  try {
    const row = await prisma.candidate.findFirst({
      where: { id, deletedAt: null },
      include: candidateInclude,
    });
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch candidate");
  }
}

export async function createCandidate(
  input: unknown,
): Promise<ApiResponse<CandidateWithRelations>> {
  try {
    const user = await requireUser();
    const data = createCandidateSchema.parse(input);
    const row = await prisma.candidate.create({
      data: {
        ...data,
        createdById: user.id,
        updatedById: user.id,
      },
      include: candidateInclude,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${row.id}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create candidate");
  }
}

export async function updateCandidate(
  input: unknown,
): Promise<ApiResponse<CandidateWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateCandidateSchema.parse(input);
    const row = await prisma.candidate.update({
      where: { id },
      data: {
        ...patch,
        phone: patch.phone ?? null,
        resumeUrl: patch.resumeUrl ?? null,
        portfolio: patch.portfolio ?? null,
        linkedIn: patch.linkedIn ?? null,
        source: patch.source ?? null,
        score: patch.score ?? null,
        notes: patch.notes ?? null,
        updatedById: user.id,
      },
      include: candidateInclude,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${id}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update candidate");
  }
}

export async function moveCandidate(
  input: unknown,
): Promise<ApiResponse<CandidateWithRelations>> {
  try {
    const user = await requireUser();
    const { id, stage } = moveCandidateSchema.parse(input);
    const row = await prisma.candidate.update({
      where: { id },
      data: { stage, updatedById: user.id },
      include: candidateInclude,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${id}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to move candidate");
  }
}

export async function deleteCandidate(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.candidate.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/recruitment");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete candidate");
  }
}

// ── Interviews ──────────────────────────────────────────────────────

const interviewInclude = {
  candidate: {
    select: { id: true, name: true, email: true, positionApplied: true, stage: true },
  },
} satisfies Prisma.InterviewInclude;

export type InterviewWithRelations = Prisma.InterviewGetPayload<{
  include: typeof interviewInclude;
}>;

export async function listInterviews(
  candidateId?: string,
): Promise<ApiResponse<InterviewWithRelations[]>> {
  try {
    const where: Prisma.InterviewWhereInput = {};
    if (candidateId) where.candidateId = candidateId;
    const rows = await prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      include: interviewInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list interviews");
  }
}

export async function createInterview(
  input: unknown,
): Promise<ApiResponse<InterviewWithRelations>> {
  try {
    await requireUser();
    const data = createInterviewSchema.parse(input);
    const row = await prisma.interview.create({
      data: {
        ...data,
        interviewerId: data.interviewerId ?? undefined,
        notes: data.notes ?? undefined,
        rating: data.rating ?? undefined,
        result: data.result ?? undefined,
      },
      include: interviewInclude,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${data.candidateId}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to schedule interview");
  }
}

export async function updateInterview(
  input: unknown,
): Promise<ApiResponse<InterviewWithRelations>> {
  try {
    await requireUser();
    const { id, ...patch } = updateInterviewSchema.parse(input);
    const row = await prisma.interview.update({
      where: { id },
      data: {
        ...patch,
        interviewerId: patch.interviewerId ?? null,
        notes: patch.notes ?? null,
        rating: patch.rating ?? null,
        result: patch.result ?? null,
      },
      include: interviewInclude,
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${row.candidateId}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update interview");
  }
}

export async function deleteInterview(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const row = await prisma.interview.delete({ where: { id } });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${row.candidateId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete interview");
  }
}

// ── Scorecards ──────────────────────────────────────────────────────

const scorecardInclude = {} satisfies Prisma.ScorecardInclude;

export type ScorecardWithRelations = Prisma.ScorecardGetPayload<{
  include: typeof scorecardInclude;
}>;

export async function listScorecards(
  candidateId?: string,
): Promise<ApiResponse<ScorecardWithRelations[]>> {
  try {
    const where: Prisma.ScorecardWhereInput = {};
    if (candidateId) where.candidateId = candidateId;
    const rows = await prisma.scorecard.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list scorecards");
  }
}

export async function createScorecard(
  input: unknown,
): Promise<ApiResponse<ScorecardWithRelations>> {
  try {
    const user = await requireUser();
    const data = createScorecardSchema.parse(input);
    const row = await prisma.scorecard.create({
      data: {
        ...data,
        notes: data.notes ?? undefined,
        createdById: user.id,
      },
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${data.candidateId}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to add scorecard");
  }
}

export async function updateScorecard(
  input: unknown,
): Promise<ApiResponse<ScorecardWithRelations>> {
  try {
    await requireUser();
    const { id, ...patch } = updateScorecardSchema.parse(input);
    const row = await prisma.scorecard.update({
      where: { id },
      data: { ...patch, notes: patch.notes ?? null },
    });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${row.candidateId}`);
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update scorecard");
  }
}

export async function deleteScorecard(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const row = await prisma.scorecard.delete({ where: { id } });
    revalidatePath("/recruitment");
    revalidatePath(`/recruitment/${row.candidateId}`);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete scorecard");
  }
}

// ── Metrics ─────────────────────────────────────────────────────────

export type RecruitmentMetrics = {
  totalCandidates: number;
  byStage: Record<string, number>;
  hiredThisMonth: number;
  rejectedThisMonth: number;
  upcomingInterviews: number;
  avgScore: number | null;
};

export async function getRecruitmentMetrics(): Promise<
  ApiResponse<RecruitmentMetrics>
> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const now = new Date();

    const [candidates, hiredThisMonth, rejectedThisMonth, upcoming, scored] =
      await Promise.all([
        prisma.candidate.findMany({
          where: { deletedAt: null },
          select: { stage: true, score: true },
        }),
        prisma.candidate.count({
          where: {
            deletedAt: null,
            stage: "HIRED",
            updatedAt: { gte: startOfMonth, lt: endOfMonth },
          },
        }),
        prisma.candidate.count({
          where: {
            deletedAt: null,
            stage: "REJECTED",
            updatedAt: { gte: startOfMonth, lt: endOfMonth },
          },
        }),
        prisma.interview.count({ where: { scheduledAt: { gte: now } } }),
        prisma.candidate.findMany({
          where: { deletedAt: null, score: { not: null } },
          select: { score: true },
        }),
      ]);

    const byStage: Record<string, number> = {};
    for (const c of candidates) {
      byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
    }

    const avgScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, c) => s + (c.score ?? 0), 0) / scored.length,
          )
        : null;

    return ok({
      totalCandidates: candidates.length,
      byStage,
      hiredThisMonth,
      rejectedThisMonth,
      upcomingInterviews: upcoming,
      avgScore,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
