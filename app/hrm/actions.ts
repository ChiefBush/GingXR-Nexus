"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { ok, fail, type ApiResponse } from "@/lib/api-response";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createDesignationSchema,
  updateDesignationSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  decideLeaveRequestSchema,
  recordAttendanceSchema,
  updateAttendanceSchema,
  createHolidaySchema,
  updateHolidaySchema,
} from "@/lib/validations/hrm";
import type { Prisma } from "@prisma/client";

// ── Departments ─────────────────────────────────────────────────────

const departmentInclude = {
  _count: { select: { employees: { where: { deletedAt: null } } } },
} satisfies Prisma.DepartmentInclude;

export type DepartmentWithCount = Prisma.DepartmentGetPayload<{
  include: typeof departmentInclude;
}>;

export async function listDepartments(): Promise<ApiResponse<DepartmentWithCount[]>> {
  try {
    const rows = await prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: departmentInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list departments");
  }
}

export async function createDepartment(
  input: unknown,
): Promise<ApiResponse<DepartmentWithCount>> {
  try {
    await requireUser();
    const data = createDepartmentSchema.parse(input);
    const row = await prisma.department.create({
      data: { name: data.name, description: data.description ?? undefined },
      include: departmentInclude,
    });
    revalidatePath("/hrm");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create department");
  }
}

export async function updateDepartment(
  input: unknown,
): Promise<ApiResponse<DepartmentWithCount>> {
  try {
    await requireUser();
    const { id, ...patch } = updateDepartmentSchema.parse(input);
    const row = await prisma.department.update({
      where: { id },
      data: { ...patch, description: patch.description ?? null },
      include: departmentInclude,
    });
    revalidatePath("/hrm");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update department");
  }
}

export async function deleteDepartment(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/hrm");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete department");
  }
}

// ── Designations ────────────────────────────────────────────────────

const designationInclude = {
  _count: { select: { employees: { where: { deletedAt: null } } } },
} satisfies Prisma.DesignationInclude;

export type DesignationWithCount = Prisma.DesignationGetPayload<{
  include: typeof designationInclude;
}>;

export async function listDesignations(): Promise<ApiResponse<DesignationWithCount[]>> {
  try {
    const rows = await prisma.designation.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      include: designationInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list designations");
  }
}

export async function createDesignation(
  input: unknown,
): Promise<ApiResponse<DesignationWithCount>> {
  try {
    await requireUser();
    const data = createDesignationSchema.parse(input);
    const row = await prisma.designation.create({
      data: { title: data.title, description: data.description ?? undefined },
      include: designationInclude,
    });
    revalidatePath("/hrm");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create designation");
  }
}

export async function updateDesignation(
  input: unknown,
): Promise<ApiResponse<DesignationWithCount>> {
  try {
    await requireUser();
    const { id, ...patch } = updateDesignationSchema.parse(input);
    const row = await prisma.designation.update({
      where: { id },
      data: { ...patch, description: patch.description ?? null },
      include: designationInclude,
    });
    revalidatePath("/hrm");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update designation");
  }
}

export async function deleteDesignation(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.designation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/hrm");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete designation");
  }
}

// ── Employees ───────────────────────────────────────────────────────

const employeeInclude = {
  department: { select: { id: true, name: true } },
  designation: { select: { id: true, title: true } },
  reportingManager: { select: { id: true, name: true, email: true } },
  user: { select: { id: true, email: true, image: true } },
} satisfies Prisma.EmployeeInclude;

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: typeof employeeInclude;
}>;

const listInclude = {
  department: { select: { id: true, name: true } },
  designation: { select: { id: true, title: true } },
} satisfies Prisma.EmployeeInclude;

export type EmployeeListItem = Prisma.EmployeeGetPayload<{
  include: typeof listInclude;
}>;

// Slug: EMP-1, EMP-2, ... based on insertion order. Unique on employeeId column.
async function nextEmployeeId(): Promise<string> {
  const last = await prisma.employee.findFirst({
    orderBy: { createdAt: "desc" },
    select: { employeeId: true },
  });
  let n = 1;
  if (last?.employeeId) {
    const m = last.employeeId.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `EMP-${n}`;
}

export async function createEmployee(
  input: unknown,
): Promise<ApiResponse<EmployeeWithRelations>> {
  try {
    const user = await requireUser();
    const data = createEmployeeSchema.parse(input);
    const employeeId = await nextEmployeeId();
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        userId: data.userId ?? undefined,
        name: data.name,
        email: data.email,
        phone: data.phone ?? undefined,
        photo: data.photo ?? undefined,
        departmentId: data.departmentId ?? undefined,
        designationId: data.designationId ?? undefined,
        joiningDate: data.joiningDate,
        employmentType: data.employmentType,
        salary: data.salary ?? undefined,
        reportingManagerId: data.reportingManagerId ?? undefined,
        status: data.status,
        createdById: user.id,
        updatedById: user.id,
      },
      include: employeeInclude,
    });
    revalidatePath("/hrm");
    revalidatePath(`/hrm/${employee.id}`);
    return ok(employee);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create employee");
  }
}

export async function updateEmployee(
  input: unknown,
): Promise<ApiResponse<EmployeeWithRelations>> {
  try {
    const user = await requireUser();
    const { id, ...patch } = updateEmployeeSchema.parse(input);
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...patch,
        userId: patch.userId ?? null,
        phone: patch.phone ?? null,
        photo: patch.photo ?? null,
        departmentId: patch.departmentId ?? null,
        designationId: patch.designationId ?? null,
        salary: patch.salary ?? null,
        reportingManagerId: patch.reportingManagerId ?? null,
        updatedById: user.id,
      },
      include: employeeInclude,
    });
    revalidatePath("/hrm");
    revalidatePath(`/hrm/${id}`);
    return ok(employee);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update employee");
  }
}

export async function deleteEmployee(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await requireUser();
    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: user.id },
    });
    revalidatePath("/hrm");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete employee");
  }
}

export async function listEmployees(): Promise<ApiResponse<EmployeeListItem[]>> {
  try {
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: listInclude,
    });
    return ok(employees);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list employees");
  }
}

export async function getEmployee(
  id: string,
): Promise<ApiResponse<EmployeeWithRelations | null>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: employeeInclude,
    });
    return ok(employee);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch employee");
  }
}

// ── Leave Requests ──────────────────────────────────────────────────

const leaveInclude = {
  employee: { select: { id: true, name: true, email: true, employeeId: true } },
} satisfies Prisma.LeaveRequestInclude;

export type LeaveWithRelations = Prisma.LeaveRequestGetPayload<{
  include: typeof leaveInclude;
}>;

export async function listLeaveRequests(): Promise<ApiResponse<LeaveWithRelations[]>> {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      include: leaveInclude,
    });
    return ok(leaves);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list leave requests");
  }
}

export async function createLeaveRequest(
  input: unknown,
): Promise<ApiResponse<LeaveWithRelations>> {
  try {
    await requireUser();
    const data = createLeaveRequestSchema.parse(input);
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason ?? undefined,
        status: "PENDING",
      },
      include: leaveInclude,
    });
    revalidatePath("/hrm/leaves");
    return ok(leave);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create leave request");
  }
}

export async function updateLeaveRequest(
  input: unknown,
): Promise<ApiResponse<LeaveWithRelations>> {
  try {
    await requireUser();
    const { id, ...patch } = updateLeaveRequestSchema.parse(input);
    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        ...patch,
        reason: patch.reason ?? null,
        // Note: status transitions go through decideLeaveRequest, not here.
      },
      include: leaveInclude,
    });
    revalidatePath("/hrm/leaves");
    return ok(leave);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update leave request");
  }
}

export async function decideLeaveRequest(
  input: unknown,
): Promise<ApiResponse<LeaveWithRelations>> {
  try {
    const user = await requireUser();
    const { id, status } = decideLeaveRequestSchema.parse(input);
    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedById: user.id },
      include: leaveInclude,
    });
    revalidatePath("/hrm/leaves");
    return ok(leave);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to decide leave request");
  }
}

export async function deleteLeaveRequest(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.leaveRequest.delete({ where: { id } });
    revalidatePath("/hrm/leaves");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete leave request");
  }
}

// ── Attendance ──────────────────────────────────────────────────────

const attendanceInclude = {
  employee: { select: { id: true, name: true, email: true, employeeId: true } },
} satisfies Prisma.AttendanceInclude;

export type AttendanceWithRelations = Prisma.AttendanceGetPayload<{
  include: typeof attendanceInclude;
}>;

export async function listAttendance(
  date?: string,
  employeeId?: string,
): Promise<ApiResponse<AttendanceWithRelations[]>> {
  try {
    const where: Prisma.AttendanceWhereInput = {};
    if (date) where.date = new Date(date);
    if (employeeId) where.employeeId = employeeId;
    const rows = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: attendanceInclude,
    });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list attendance");
  }
}

export async function recordAttendance(
  input: unknown,
): Promise<ApiResponse<AttendanceWithRelations>> {
  try {
    await requireUser();
    const data = recordAttendanceSchema.parse(input);
    // Upsert on (employeeId, date) so a single day has one record per employee.
    const row = await prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: data.employeeId, date: data.date },
      },
      create: {
        employeeId: data.employeeId,
        date: data.date,
        checkIn: data.checkIn ?? undefined,
        checkOut: data.checkOut ?? undefined,
        status: data.status,
        note: data.note ?? undefined,
      },
      update: {
        checkIn: data.checkIn ?? null,
        checkOut: data.checkOut ?? null,
        status: data.status,
        note: data.note ?? null,
      },
      include: attendanceInclude,
    });
    revalidatePath("/hrm/attendance");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to record attendance");
  }
}

export async function updateAttendance(
  input: unknown,
): Promise<ApiResponse<AttendanceWithRelations>> {
  try {
    await requireUser();
    const { id, ...patch } = updateAttendanceSchema.parse(input);
    const row = await prisma.attendance.update({
      where: { id },
      data: {
        ...patch,
        checkIn: patch.checkIn ?? null,
        checkOut: patch.checkOut ?? null,
        note: patch.note ?? null,
      },
      include: attendanceInclude,
    });
    revalidatePath("/hrm/attendance");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update attendance");
  }
}

// ── Holidays ────────────────────────────────────────────────────────

export async function listHolidays(): Promise<ApiResponse<Prisma.HolidayGetPayload<{}>[]>> {
  try {
    const rows = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list holidays");
  }
}

export async function createHoliday(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const data = createHolidaySchema.parse(input);
    const row = await prisma.holiday.create({ data });
    revalidatePath("/hrm");
    revalidatePath("/hrm/holidays");
    return ok(row);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to create holiday");
  }
}

export async function updateHoliday(
  input: unknown,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    const { id, ...patch } = updateHolidaySchema.parse(input);
    const row = await prisma.holiday.update({
      where: { id },
      data: { ...patch, description: patch.description ?? null },
    });
    revalidatePath("/hrm/holidays");
    return ok({ id: row.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to update holiday");
  }
}

export async function deleteHoliday(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    await requireUser();
    await prisma.holiday.delete({ where: { id } });
    revalidatePath("/hrm/holidays");
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to delete holiday");
  }
}

// ── List-page metrics ───────────────────────────────────────────────

export type HrmMetrics = {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  pendingLeaves: number;
  approvedLeavesThisMonth: number;
  presentToday: number;
  departments: number;
  upcomingHolidays: number;
};

export async function getHrmMetrics(): Promise<ApiResponse<HrmMetrics>> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      pendingLeaves,
      approvedLeavesThisMonth,
      presentToday,
      departments,
      upcomingHolidays,
    ] = await Promise.all([
      prisma.employee.count({ where: { deletedAt: null } }),
      prisma.employee.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.employee.count({ where: { deletedAt: null, status: "ON_LEAVE" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: { gte: startOfMonth, lt: endOfMonth },
        },
      }),
      prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow }, status: "PRESENT" },
      }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.holiday.count({ where: { date: { gte: today } } }),
    ]);
    return ok({
      totalEmployees,
      activeEmployees,
      onLeave,
      pendingLeaves,
      approvedLeavesThisMonth,
      presentToday,
      departments,
      upcomingHolidays,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to fetch metrics");
  }
}
