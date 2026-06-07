import { z } from "zod";

// Status fields are free-form strings on these models. We define a constrained
// set per entity to keep the UI predictable while still allowing custom values.
export const investorStatusEnum = z.enum([
  "ACTIVE",
  "PASS",
  "COMMITTED",
  "PASSED",
  "ON_HOLD",
]);
export const grantStatusEnum = z.enum([
  "RESEARCHING",
  "APPLIED",
  "IN_REVIEW",
  "AWARDED",
  "REJECTED",
  "WITHDRAWN",
]);
export const partnershipStatusEnum = z.enum([
  "PROSPECTING",
  "DISCUSSION",
  "AGREEMENT",
  "ACTIVE",
  "PAUSED",
  "ENDED",
]);
export const partnershipTypeEnum = z.enum([
  "RESELLER",
  "TECHNOLOGY",
  "MARKETING",
  "INTEGRATION",
  "STRATEGIC",
  "OTHER",
]);
export const vendorStatusEnum = z.enum([
  "ACTIVE",
  "ON_HOLD",
  "ENDED",
]);

// ── Investor ────────────────────────────────────────────────────────

export const createInvestorSchema = z.object({
  name: z.string().min(1).max(200),
  fund: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  ticketSize: z.string().max(100).optional().nullable(),
  lastMeeting: z.coerce.date().optional().nullable(),
  nextFollowUp: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  status: investorStatusEnum.default("ACTIVE"),
});
export const updateInvestorSchema = createInvestorSchema.partial().extend({
  id: z.string().uuid(),
});

// ── Grant ───────────────────────────────────────────────────────────

export const createGrantSchema = z
  .object({
    program: z.string().min(1).max(200),
    organization: z.string().min(1).max(200),
    status: grantStatusEnum.default("APPLIED"),
    amount: z.coerce.number().nonnegative().optional().nullable(),
    deadline: z.coerce.date().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
  });
export const updateGrantSchema = createGrantSchema.partial().extend({
  id: z.string().uuid(),
});

// ── Partnership ─────────────────────────────────────────────────────

export const createPartnershipSchema = z.object({
  organization: z.string().min(1).max(200),
  contactName: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  status: partnershipStatusEnum.default("DISCUSSION"),
  type: partnershipTypeEnum.optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export const updatePartnershipSchema = createPartnershipSchema
  .partial()
  .extend({ id: z.string().uuid() });

// ── Vendor ──────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  service: z.string().max(200).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  contractUrl: z.string().url().max(2000).optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  status: vendorStatusEnum.default("ACTIVE"),
});
export const updateVendorSchema = createVendorSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateInvestorInput = z.infer<typeof createInvestorSchema>;
export type UpdateInvestorInput = z.infer<typeof updateInvestorSchema>;
export type CreateGrantInput = z.infer<typeof createGrantSchema>;
export type UpdateGrantInput = z.infer<typeof updateGrantSchema>;
export type CreatePartnershipInput = z.infer<typeof createPartnershipSchema>;
export type UpdatePartnershipInput = z.infer<typeof updatePartnershipSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
