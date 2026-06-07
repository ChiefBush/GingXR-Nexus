import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewEmployeeDialog } from "@/components/hrm/new-employee-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import {
  listEmployees,
  listDepartments,
  listDesignations,
  getHrmMetrics,
} from "./actions";
import type { EmployeeStatus, EmploymentType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HrmPage() {
  return (
    <ProtectedLayout>
      <HrmContent />
    </ProtectedLayout>
  );
}

async function HrmContent() {
  const [employeesRes, deptsRes, desigsRes, metricsRes] = await Promise.all([
    listEmployees(),
    listDepartments(),
    listDesignations(),
    getHrmMetrics(),
  ]);
  const employees = employeesRes.success ? employeesRes.data : [];
  const departments = deptsRes.success ? deptsRes.data : [];
  const designations = desigsRes.success ? desigsRes.data : [];
  const m = metricsRes.success
    ? metricsRes.data
    : {
        totalEmployees: 0,
        activeEmployees: 0,
        onLeave: 0,
        pendingLeaves: 0,
        approvedLeavesThisMonth: 0,
        presentToday: 0,
        departments: 0,
        upcomingHolidays: 0,
      };

  return (
    <>
      <PageHeader
        title="HRM"
        description={`${m.totalEmployees} employees · ${m.activeEmployees} active · ${m.pendingLeaves} leave requests pending`}
        actions={
          <div className="flex gap-2">
            <Link
              href="/hrm/leaves"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent"
            >
              Leaves
            </Link>
            <Link
              href="/hrm/attendance"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent"
            >
              Attendance
            </Link>
            <Link
              href="/hrm/holidays"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent"
            >
              Holidays
            </Link>
            <NewEmployeeDialog
              departments={departments}
              designations={designations}
              employees={employees}
            />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Employees" value={m.totalEmployees} />
        <MetricCard label="Active" value={m.activeEmployees} />
        <MetricCard
          label="On Leave"
          value={m.onLeave}
          highlight={m.onLeave > 0}
        />
        <MetricCard
          label="Pending Leaves"
          value={m.pendingLeaves}
          highlight={m.pendingLeaves > 0}
        />
        <MetricCard label="Present Today" value={m.presentToday} />
        <MetricCard label="Departments" value={m.departments} />
        <MetricCard
          label="Approved (this month)"
          value={m.approvedLeavesThisMonth}
        />
        <MetricCard label="Upcoming Holidays" value={m.upcomingHolidays} />
      </div>

      {employees.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No employees yet. Click{" "}
          <span className="font-medium text-foreground">New Employee</span> to add one.
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Department</th>
                <th className="px-3 py-2 text-left font-medium">Designation</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {e.employeeId}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/hrm/${e.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.email}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.department?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {e.designation?.title ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <TypeBadge type={e.employmentType as EmploymentType} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={e.status as EmployeeStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 ${highlight ? "border-warning/30 bg-warning/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${highlight ? "text-warning" : "text-foreground"}`}
      >
        {value}
      </p>
    </Card>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const map: Record<EmployeeStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "bg-accent text-foreground" },
    ON_LEAVE: { label: "On leave", cls: "bg-warning text-foreground" },
    TERMINATED: { label: "Terminated", cls: "bg-destructive text-destructive-foreground" },
    RESIGNED: { label: "Resigned", cls: "bg-muted text-muted-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}

function TypeBadge({ type }: { type: EmploymentType }) {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: "Full time",
    PART_TIME: "Part time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  };
  return (
    <Badge className="bg-secondary text-foreground">{map[type]}</Badge>
  );
}
