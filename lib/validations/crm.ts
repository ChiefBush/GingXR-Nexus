import { z } from "zod";

export const leadStatusEnum = z.enum([
  "NEW",
  "QUALIFIED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const leadPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createLeadSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  contactName: z.string().min(1, "Contact name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(50).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  value: z.coerce.number().nonnegative().optional().nullable(),
  priority: leadPriorityEnum.default("MEDIUM"),
  status: leadStatusEnum.default("NEW"),
  notes: z.string().max(5000).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().uuid(),
});

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: leadStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
  search: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  sortBy: z.enum(["createdAt", "companyName", "value", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
