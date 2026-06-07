import { z } from "zod";

export const candidateStageEnum = z.enum([
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_ROUND",
  "ASSIGNMENT",
  "OFFER",
  "HIRED",
  "REJECTED",
]);
export const interviewTypeEnum = z.enum([
  "PHONE",
  "VIDEO",
  "ONSITE",
  "PANEL",
]);
export const interviewResultEnum = z.enum([
  "STRONG_HIRE",
  "HIRE",
  "NO_DECISION",
  "NO_HIRE",
  "STRONG_NO_HIRE",
]);

// ── Candidates ──────────────────────────────────────────────────────

export const createCandidateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().nullable(),
  resumeUrl: z.string().url().max(2000).optional().nullable(),
  portfolio: z.string().url().max(2000).optional().nullable(),
  linkedIn: z.string().url().max(2000).optional().nullable(),
  positionApplied: z.string().min(1).max(200),
  source: z.string().max(100).optional().nullable(),
  stage: candidateStageEnum.default("APPLIED"),
  score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateCandidateSchema = createCandidateSchema.partial().extend({
  id: z.string().uuid(),
});

export const moveCandidateSchema = z.object({
  id: z.string().uuid(),
  stage: candidateStageEnum,
});

export const candidateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
  stage: candidateStageEnum.optional(),
  positionApplied: z.string().optional(),
  search: z.string().optional(),
});

// ── Interviews ──────────────────────────────────────────────────────

export const createInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  interviewerId: z.string().uuid().optional().nullable(),
  scheduledAt: z.coerce.date(),
  type: interviewTypeEnum.default("VIDEO"),
  notes: z.string().max(5000).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  result: interviewResultEnum.optional().nullable(),
});

export const updateInterviewSchema = createInterviewSchema.partial().extend({
  id: z.string().uuid(),
});

// ── Scorecards ──────────────────────────────────────────────────────

export const createScorecardSchema = z.object({
  candidateId: z.string().uuid(),
  criteria: z.string().min(1).max(200),
  score: z.coerce.number().int().min(0).max(100),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateScorecardSchema = createScorecardSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type MoveCandidateInput = z.infer<typeof moveCandidateSchema>;
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type CreateScorecardInput = z.infer<typeof createScorecardSchema>;
export type UpdateScorecardInput = z.infer<typeof updateScorecardSchema>;
