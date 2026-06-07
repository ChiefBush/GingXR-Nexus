import { z } from "zod";

export const employmentTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);
export const employeeStatusEnum = z.enum([
  "ACTIVE",
  "ON_LEAVE",
  "TERMINATED",
  "RESIGNED",
]);
export const leaveTypeEnum = z.enum(["CASUAL", "SICK", "EARNED", "WORK_FROM_HOME"]);
export const leaveStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const attendanceStatusEnum = z.enum([
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "WORK_FROM_HOME",
]);

// ── Departments & Designations ──────────────────────────────────────

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
});
export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
});

export const createDesignationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
});
export const updateDesignationSchema = createDesignationSchema.partial().extend({
  id: z.string().uuid(),
});

// ── Employees ───────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  // userId is optional — an employee record can exist before the user signs up.
  userId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().nullable(),
  photo: z.string().url().max(2000).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  joiningDate: z.coerce.date(),
  employmentType: employmentTypeEnum.default("FULL_TIME"),
  salary: z.coerce.number().nonnegative().optional().nullable(),
  reportingManagerId: z.string().uuid().optional().nullable(),
  status: employeeStatusEnum.default("ACTIVE"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().uuid(),
});

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  status: employeeStatusEnum.optional(),
  search: z.string().optional(),
});

// ── Leave Requests ──────────────────────────────────────────────────

const baseCreateLeaveRequest = z.object({
  employeeId: z.string().uuid(),
  leaveType: leaveTypeEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(2000).optional().nullable(),
});
export const createLeaveRequestSchema = baseCreateLeaveRequest.refine(
  (v) => v.endDate >= v.startDate,
  { message: "endDate must be on or after startDate", path: ["endDate"] },
);
export const updateLeaveRequestSchema = baseCreateLeaveRequest
  .partial()
  .extend({ id: z.string().uuid() });

export const decideLeaveRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

// ── Attendance ──────────────────────────────────────────────────────

const baseRecordAttendance = z.object({
  employeeId: z.string().uuid(),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional().nullable(),
  checkOut: z.coerce.date().optional().nullable(),
  status: attendanceStatusEnum.default("PRESENT"),
  note: z.string().max(1000).optional().nullable(),
});
export const recordAttendanceSchema = baseRecordAttendance.refine(
  (v) => !v.checkIn || !v.checkOut || v.checkOut >= v.checkIn,
  { message: "checkOut must be on or after checkIn", path: ["checkOut"] },
);

export const updateAttendanceSchema = baseRecordAttendance.partial().extend({
  id: z.string().uuid(),
});

// ── Holidays ────────────────────────────────────────────────────────

export const createHolidaySchema = z.object({
  name: z.string().min(1).max(200),
  date: z.coerce.date(),
  description: z.string().max(2000).optional().nullable(),
  recurring: z.boolean().default(false),
});

export const updateHolidaySchema = createHolidaySchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
